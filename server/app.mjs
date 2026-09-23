import express from "express";
import { reply } from "./assistant.mjs";
import { randomInt, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { z } from "zod";
import * as db from "./store.mjs";
import { token, hash, equal, encodeSecret, passwordMatches, safeCase } from "./security.mjs";
import { authenticateStaff, findStaffByEmail, publicStaff, staffUsers } from "./staff.mjs";
import { accessCodeEmailConfigured, sendStaffAccessCode } from "./email.mjs";
import {
  uploadURL,
  downloadURL,
  verifyUpload,
  localPath,
  storageConfigured,
} from "./storage.mjs";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  next();
});
app.use(express.json({ limit: "64kb" }));

const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const bearer = (req) => req.headers.authorization?.replace(/^Bearer /, "") || "";

async function staff(req) {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("tfae="))
    ?.slice(5);
  if (!value) return null;
  const session = await db.get("auth-" + hash(value));
  if (!session || session.expires <= Date.now()) return null;
  if (session.staff) return publicStaff(session.staff);

  // Safely preserve a pre-migration session only for the legacy account that created it.
  const legacyEmail = String(process.env.STAFF_EMAIL || "").trim().toLowerCase();
  if (legacyEmail) {
    const legacy = staffUsers().find((user) => user.email === legacyEmail);
    return legacy ? publicStaff(legacy) : null;
  }
  return null;
}

async function requireStaff(req, res, next) {
  const profile = await staff(req);
  if (!profile) throw fail("Acesse sua conta da equipe.", 401);
  req.staff = profile;
  next();
}

async function requireTfae(req, res, next) {
  const profile = req.staff || await staff(req);
  if (!profile) throw fail("Acesse sua conta da equipe.", 401);
  if (profile.role !== "tfae") throw fail("Esta conta possui acesso somente de acompanhamento.", 403);
  req.staff = profile;
  next();
}

async function access(req, id) {
  const c = await db.get(id);
  if (!c || c.kind !== "case") throw fail("Caso não encontrado.", 404);
  if (!equal(c.accessHash, hash(bearer(req))) && !(await staff(req)))
    throw fail("Código de acesso inválido.", 403);
  return c;
}

app.use("/api", (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    if (
      origin &&
      origin !== process.env.APP_ORIGIN &&
      origin !== `http://${req.headers.host}` &&
      origin !== `https://${req.headers.host}`
    )
      return res.status(403).json({ error: "Origem não permitida." });
  }
  next();
});

app.post("/api/chat", async (req, res) =>
  res.json({ reply: await reply(req.body) }),
);

// This endpoint performs a real database round trip. Previously it only
// checked whether environment variables existed, which could report ok while
// the database itself was unavailable or waking from suspension.
app.get("/api/health", async (req, res) => {
  const started = Date.now();
  let database = "missing";
  let databaseLatencyMs = null;
  let databaseError = null;

  try {
    databaseLatencyMs = await db.ping();
    database = process.env.DATABASE_URL ? "ready" : "local";
  } catch (error) {
    database = "unavailable";
    databaseError = error instanceof Error ? error.message : String(error);
  }

  const storage = storageConfigured()
    ? "configured"
    : process.env.VERCEL
      ? "missing"
      : "local";
  const ok = database !== "missing" && database !== "unavailable" && storage !== "missing";

  res.status(ok ? 200 : 503).json({
    ok,
    database,
    databaseLatencyMs,
    storage,
    staff: staffUsers().length > 0,
    staffEmailCode: accessCodeEmailConfigured(),
    responseTimeMs: Date.now() - started,
    ...(databaseError && process.env.NODE_ENV !== "production" ? { databaseError } : {}),
  });
});

app.get("/api/postal/br/:cep", async (req, res) => {
  const cep = String(req.params.cep || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep)) throw fail("CEP inválido.", 400);
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw fail("Não foi possível consultar o CEP.", 502);
    const data = await response.json();
    if (data.erro) throw fail("CEP não encontrado.", 404);
    // Address data changes rarely and can safely be cached at the browser/CDN.
    res.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.json({
      postalCode: data.cep || cep,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      addressComplement: data.complemento || "",
    });
  } catch (error) {
    if (error?.status) throw error;
    throw fail("Não foi possível consultar o CEP agora. Tente novamente.", 502);
  }
});

const ACCESS_CODE_TTL_MS = 10 * 60 * 1000;
const ACCESS_CODE_RETRY_MS = 60 * 1000;
const STAFF_SESSION_MS = 8 * 60 * 60 * 1000;
const TRUSTED_DEVICE_MS = 7 * 24 * 60 * 60 * 1000;

function requestAddress(req) {
  return (
    req.headers["x-vercel-forwarded-for"] ||
    req.ip ||
    req.socket.remoteAddress ||
    "local"
  ).toString().split(",")[0].trim();
}

async function consumeAccessCodeRate(key, max, cooldownMs = 0) {
  const now = Date.now();
  const old = await db.get(key);
  const rate = old && old.until > now
    ? old
    : { count: 0, until: now + 15 * 60 * 1000, lastAt: 0 };
  if (rate.count >= max) throw fail("Muitas tentativas. Aguarde 15 minutos.", 429);
  if (cooldownMs && rate.lastAt && now - rate.lastAt < cooldownMs)
    throw fail("Aguarde um minuto antes de solicitar outro código.", 429);
  await db.put("rate", key, { ...rate, count: rate.count + 1, lastAt: now });
}

async function checkAccessCodeRate(req, email) {
  await consumeAccessCodeRate("otp-rate-email-" + hash(email), 6, ACCESS_CODE_RETRY_MS);
  await consumeAccessCodeRate("otp-rate-ip-" + hash(requestAddress(req)), 30);
}

app.get("/api/auth/config", async (req, res) => {
  const emailCode = accessCodeEmailConfigured();
  res.json({
    emailCode,
    passwordFallback: !emailCode || process.env.AUTH_ALLOW_PASSWORD_FALLBACK === "true",
    trustedDeviceDays: 7,
  });
});

app.post("/api/auth/request-code", async (req, res) => {
  if (!accessCodeEmailConfigured())
    throw fail("Acesso por código ainda não configurado.", 503);

  const input = z.object({
    email: z.email().max(180),
    language: z.string().max(20).optional(),
  }).parse(req.body);
  const email = input.email.trim().toLowerCase();
  await checkAccessCodeRate(req, email);

  const profile = findStaffByEmail(email);
  let debugCode;
  if (profile) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const id = "auth-code-" + hash(profile.email);
    await db.put("auth_code", id, {
      staffId: profile.id,
      email: profile.email,
      codeHash: encodeSecret(code),
      attempts: 0,
      expires: Date.now() + ACCESS_CODE_TTL_MS,
    });
    try {
      const result = await sendStaffAccessCode({
        to: profile.email,
        code,
        language: input.language,
      });
      debugCode = result.debugCode;
    } catch (error) {
      await db.remove(id);
      throw error;
    }
  }

  res.status(202).json({
    ok: true,
    expiresInSeconds: ACCESS_CODE_TTL_MS / 1000,
    retryAfterSeconds: ACCESS_CODE_RETRY_MS / 1000,
    ...(process.env.NODE_ENV === "test" && debugCode ? { debugCode } : {}),
  });
});

app.post("/api/auth/verify-code", async (req, res) => {
  if (!accessCodeEmailConfigured())
    throw fail("Acesso por código ainda não configurado.", 503);

  const input = z.object({
    email: z.email().max(180),
    code: z.string().regex(/^\d{6}$/),
    trustDevice: z.boolean().default(false),
  }).parse(req.body);
  const email = input.email.trim().toLowerCase();
  const profile = findStaffByEmail(email);
  const id = "auth-code-" + hash(email);
  const record = await db.get(id);
  const now = Date.now();

  if (!profile || !record || record.email !== profile.email || record.expires <= now) {
    if (record?.expires <= now) await db.remove(id);
    throw fail("Código inválido ou expirado.", 401);
  }
  if (record.attempts >= 5) {
    await db.remove(id);
    throw fail("Código bloqueado após muitas tentativas. Solicite um novo.", 429);
  }
  if (!passwordMatches(input.code, record.codeHash)) {
    await db.put("auth_code", id, { ...record, attempts: record.attempts + 1 });
    throw fail("Código inválido ou expirado.", 401);
  }

  await db.remove(id);
  const t = token();
  const maxAge = input.trustDevice ? TRUSTED_DEVICE_MS : STAFF_SESSION_MS;
  await db.put("auth", "auth-" + hash(t), {
    expires: now + maxAge,
    staff: publicStaff(profile),
    trustedDevice: input.trustDevice,
  });

  const cookie = {
    httpOnly: true,
    secure: !!process.env.VERCEL,
    sameSite: "strict",
    path: "/",
  };
  if (input.trustDevice) cookie.maxAge = TRUSTED_DEVICE_MS;

  res
    .cookie("tfae", t, cookie)
    .json({ ok: true, staff: publicStaff(profile), trustedUntil: input.trustDevice ? now + TRUSTED_DEVICE_MS : null });
});

// Temporary migration fallback. Once e-mail codes are configured this route is
// disabled unless AUTH_ALLOW_PASSWORD_FALLBACK=true is explicitly set.
app.post("/api/auth/login", async (req, res) => {
  if (accessCodeEmailConfigured() && process.env.AUTH_ALLOW_PASSWORD_FALLBACK !== "true")
    throw fail("Use o código enviado por e-mail.", 409);

  const key =
    "rate-" +
    hash(requestAddress(req));
  const now = Date.now();
  const old = await db.get(key);
  const rate = old && old.until > now ? old : { count: 0, until: now + 900000 };
  if (rate.count >= 10) throw fail("Muitas tentativas. Aguarde 15 minutos.", 429);
  await db.put("rate", key, { ...rate, count: rate.count + 1 });
  if (staffUsers().length === 0)
    throw fail("Acesso da equipe ainda não configurado.", 503);
  const profile = authenticateStaff(req.body.email, req.body.password);
  if (!profile) throw fail("E-mail ou senha inválidos.", 401);
  const t = token();
  await db.put("auth", "auth-" + hash(t), {
    expires: now + STAFF_SESSION_MS,
    staff: profile,
  });
  res
    .cookie("tfae", t, {
      httpOnly: true,
      secure: !!process.env.VERCEL,
      sameSite: "strict",
      path: "/",
    })
    .json({ ok: true, staff: profile });
});

app.get("/api/auth/me", async (req, res) => {
  const profile = await staff(req);
  res.json({
    authenticated: !!profile,
    email: profile?.email || null,
    staff: profile || null,
  });
});

app.get("/api/auth/staff", requireStaff, async (req, res) => {
  res.json({ staff: staffUsers().map(publicStaff) });
});

app.get("/api/auth/staff-overview", requireStaff, async (req, res) => {
  const counts = await db.ownerStats();
  const byOwner = new Map(counts.map((item) => [item.owner, item]));
  const analysts = staffUsers()
    .map(publicStaff)
    .filter((user) => user.role === "tfae")
    .map((user) => {
      const stats = byOwner.get(user.name) || { total: 0, active: 0 };
      return { ...user, assigned: stats.total, active: stats.active };
    });
  res.json({ staff: analysts });
});

app.post("/api/auth/logout", async (req, res) => {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("tfae="))
    ?.slice(5);
  if (value) await db.remove("auth-" + hash(value));
  res.clearCookie("tfae", { path: "/" }).json({ ok: true });
});

const caseSchema = z.object({
  brand: z.enum(["infinix", "tecno", "itel"]),
  model: z.string().trim().min(2).max(100),
  build: z.string().max(180).default(""),
  category: z.enum(["hardware", "software"]),
  problem: z.string().trim().min(5).max(180),
  description: z.string().trim().min(15).max(5000),
  expected: z.string().max(1000).default(""),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(180),
  phone: z.string().trim().min(6).max(30),
  country: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  street: z.string().trim().min(2).max(180),
  addressNumber: z.string().trim().min(1).max(30),
  addressComplement: z.string().trim().max(120).default(""),
  neighborhood: z.string().trim().max(120).default(""),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(1).max(100),
  carrier: z.string().max(80).default(""),
  warrantyStatus: z.enum(["yes", "no", "unsure"]).default("unsure"),
  deviceIdentifier: z.string().trim().max(80).default(""),
  purchaseDate: z.string().trim().max(10).regex(/^$|^\d{4}-\d{2}-\d{2}$/).default(""),
  consent: z.literal(true),
});

app.post("/api/cases", async (req, res) => {
  const input = caseSchema.parse(req.body);
  const id = "CAS-" + randomUUID();
  const t = token();
  const c = {
    ...input,
    id,
    kind: "case",
    status: "received",
    priority: "normal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessHash: hash(t),
  };
  await db.put("case", id, c);
  res.status(201).json({ case: safeCase(c), accessToken: t });
});

app.get("/api/cases", requireStaff, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const status = String(req.query.status || "");
  const query = String(req.query.q || "").slice(0, 180);
  const [{ cases, total }, stats] = await Promise.all([
    db.listCases({ limit, offset, status, query }),
    db.caseStats(),
  ]);
  res.json({ cases: cases.map(safeCase), total, stats, limit, offset });
});

app.get("/api/cases/:id", async (req, res) => {
  const c = await access(req, req.params.id);
  const [evidence, sessions, events] = await Promise.all([
    db.listByCase("evidence", c.id),
    db.listByCase("capture", c.id),
    db.listByCase("event", c.id),
  ]);
  res.json({
    case: safeCase(c),
    evidence: evidence.filter((e) => e.uploaded),
    sessions,
    events,
  });
});

app.post("/api/cases/:id/customer-replies", async (req, res) => {
  const c = await db.get(req.params.id);
  if (!c || c.kind !== "case") throw fail("Caso não encontrado.", 404);
  if (!equal(c.accessHash, hash(bearer(req)))) throw fail("Código de acesso inválido.", 403);
  if (c.status === "resolved") throw fail("Este atendimento já foi concluído.", 409);
  const input = z.object({
    message: z.string().trim().min(1).max(2000),
  }).parse(req.body);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.put("event", id, {
    id,
    caseId: c.id,
    note: input.message,
    source: "customer",
    at: now,
  });
  await db.put("case", c.id, { ...c, updatedAt: now });
  res.status(201).json({ ok: true });
});

app.patch("/api/cases/:id", requireTfae, async (req, res) => {
  const c = await access(req, req.params.id);
  const patch = z
    .object({
      status: z
        .enum(["received", "reviewing", "awaiting_customer", "resolved"])
        .optional(),
      priority: z.enum(["normal", "high", "urgent"]).optional(),
      owner: z.string().max(100).optional(),
      note: z.string().trim().max(2000).optional(),
    })
    .parse(req.body);
  const { note, ...changes } = patch;
  if (changes.owner) {
    const assignee = staffUsers()
      .map(publicStaff)
      .find((user) => user.role === "tfae" && user.name === changes.owner);
    if (!assignee) throw fail("Responsável TFAE inválido.", 400);
  }
  await db.put("case", c.id, {
    ...c,
    ...changes,
    updatedAt: new Date().toISOString(),
  });
  const id = randomUUID();
  await db.put("event", id, {
    id,
    caseId: c.id,
    ...changes,
    note,
    source: "staff",
    staffId: req.staff?.id || "",
    staffName: req.staff?.name || "",
    staffMarket: req.staff?.market || "",
    staffCountry: req.staff?.country || "",
    staffRole: req.staff?.role || "tfae",
    at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

app.post("/api/cases/:id/evidence", async (req, res) => {
  const c = await db.get(req.params.id);
  if (!c || c.kind !== "case") throw fail("Caso não encontrado.", 404);
  const hasCaseToken = equal(c.accessHash, hash(bearer(req)));
  const profile = hasCaseToken ? null : await staff(req);
  if (!hasCaseToken && (!profile || profile.role !== "tfae"))
    throw fail("Você não tem permissão para adicionar evidências neste atendimento.", 403);
  const f = z
    .object({
      name: z.string().min(1).max(180),
      type: z.enum([
        "image/png",
        "image/jpeg",
        "video/mp4",
        "application/zip",
        "application/octet-stream",
        "text/plain",
      ]),
      size: z.number().int().positive().max(1024 * 1024 * 1024),
      sessionId: z.string().optional(),
    })
    .parse(req.body);
  if (
    c.category === "hardware" &&
    !["image/png", "image/jpeg", "video/mp4"].includes(f.type)
  ) {
    throw fail("Casos de hardware aceitam somente fotos e vídeos.", 400);
  }
  if (f.sessionId) {
    const s = await db.get(f.sessionId);
    if (!s || s.caseId !== c.id) throw fail("Sessão inválida.");
  }
  const id = randomUUID();
  const e = {
    ...f,
    id,
    caseId: c.id,
    uploaded: false,
    createdAt: new Date().toISOString(),
    uploadHash: hash(token()),
  };
  const uploadToken = token();
  e.uploadHash = hash(uploadToken);
  const url = await uploadURL(e);
  await db.put("evidence", id, e);
  res.json({ id, url, uploadToken });
});

app.put("/api/uploads/:id", async (req, res) => {
  if (process.env.VERCEL || storageConfigured())
    throw fail("Use o endereço de upload assinado.", 400);
  const e = await db.get(req.params.id);
  if (!e || e.uploaded || !equal(e.uploadHash, hash(bearer(req))))
    throw fail("Upload não autorizado.", 403);
  let size = 0;
  await pipeline(
    req,
    new Transform({
      transform(chunk, enc, cb) {
        size += chunk.length;
        cb(size > e.size ? fail("Arquivo excede o limite.") : null, chunk);
      },
    }),
    createWriteStream(localPath(e.id)),
  );
  res.json({ ok: true });
});

app.post("/api/evidence/:id/complete", async (req, res) => {
  const e = await db.get(req.params.id);
  if (!e) throw fail("Arquivo não encontrado.", 404);
  await access(req, e.caseId);
  await verifyUpload(e);
  const { uploadHash, ...rest } = e;
  await db.put("evidence", e.id, { ...rest, uploaded: true });
  res.json({ ok: true });
});

app.get("/api/evidence/:id/download", async (req, res) => {
  const e = await db.get(req.params.id);
  if (!e?.uploaded) throw fail("Arquivo indisponível.", 404);
  await access(req, e.caseId);
  const url = await downloadURL(e);
  if (url) return res.json({ url });
  res.download(localPath(e.id), e.name, { dotfiles: "allow" });
});

app.post("/api/cases/:id/sessions", async (req, res) => {
  const c = await access(req, req.params.id);
  const s = z
    .object({
      id: z.uuid(),
      status: z.enum(["complete", "partial", "failed"]),
      startedAt: z.string(),
      endedAt: z.string(),
      device: z.object({
        brand: z.string(),
        model: z.string(),
        build: z.string(),
        platform: z.enum(["MTK", "SPD", "UNKNOWN"]),
      }),
      reason: z.string().max(2000).optional(),
    })
    .parse(req.body);
  const existing = await db.get(s.id);
  if (existing && existing.caseId !== c.id)
    throw fail("Sessão já existe.", 409);
  await db.put("capture", s.id, { ...s, caseId: c.id });
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err instanceof z.ZodError ? 400 : err.status || 500;
  res.status(status).json({
    error:
      status === 500
        ? "Não foi possível concluir. Tente novamente."
        : err instanceof z.ZodError
          ? "Revise os campos obrigatórios e o formato dos dados."
          : err.message,
  });
});

export default app;
