import express from "express";
import { reply } from "./assistant.mjs";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { z } from "zod";
import * as db from "./store.mjs";
import { token, hash, equal, passwordMatches, safeCase } from "./security.mjs";
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
  if (!value) return false;
  const session = await db.get("auth-" + hash(value));
  return session && session.expires > Date.now();
}

async function requireStaff(req, res, next) {
  if (!(await staff(req))) throw fail("Acesse sua conta TFAE.", 401);
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
    staff: !!process.env.STAFF_PASSWORD_HASH,
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

app.post("/api/auth/login", async (req, res) => {
  const key =
    "rate-" +
    hash(
      (
        req.headers["x-vercel-forwarded-for"] ||
        req.ip ||
        req.socket.remoteAddress ||
        "local"
      ).toString(),
    );
  const now = Date.now();
  const old = await db.get(key);
  const rate = old && old.until > now ? old : { count: 0, until: now + 900000 };
  if (rate.count >= 10) throw fail("Muitas tentativas. Aguarde 15 minutos.", 429);
  await db.put("rate", key, { ...rate, count: rate.count + 1 });
  if (!process.env.STAFF_PASSWORD_HASH)
    throw fail("Acesso da equipe ainda não configurado.", 503);
  if (
    !equal(req.body.email || "", process.env.STAFF_EMAIL || "") ||
    !passwordMatches(String(req.body.password || ""), process.env.STAFF_PASSWORD_HASH)
  )
    throw fail("E-mail ou senha inválidos.", 401);
  const t = token();
  await db.put("auth", "auth-" + hash(t), { expires: now + 8 * 3600000 });
  res
    .cookie("tfae", t, {
      httpOnly: true,
      secure: !!process.env.VERCEL,
      sameSite: "strict",
      maxAge: 8 * 3600000,
      path: "/",
    })
    .json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const authenticated = !!(await staff(req));
  res.json({
    authenticated,
    email: authenticated ? process.env.STAFF_EMAIL : null,
  });
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

app.patch("/api/cases/:id", requireStaff, async (req, res) => {
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
    at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

app.post("/api/cases/:id/evidence", async (req, res) => {
  const c = await access(req, req.params.id);
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
