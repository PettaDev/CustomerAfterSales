import express from "express";
import { reply } from "./assistant.mjs";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { z } from "zod";
import * as db from "./store.mjs";
import { token, hash, equal, passwordMatches, safeCase } from "./security.mjs";
import { uploadURL, downloadURL, verifyUpload, localPath } from "./storage.mjs";
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  next();
});
app.use(express.json({ limit: "64kb" }));
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const bearer = (req) =>
  req.headers.authorization?.replace(/^Bearer /, "") || "";
async function staff(req) {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("tfae="))
    ?.slice(5);
  if (!value) return false;
  const s = await db.get("auth-" + hash(value));
  return s && s.expires > Date.now();
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
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    database: process.env.DATABASE_URL
      ? "configured"
      : process.env.VERCEL
        ? "missing"
        : "local",
    storage: process.env.S3_BUCKET
      ? "configured"
      : process.env.VERCEL
        ? "missing"
        : "local",
    staff: !!process.env.STAFF_PASSWORD_HASH,
  }),
);
app.post("/api/auth/login", async (req, res) => {
  const key =
    "rate-" +
    hash(
      (
        req.headers["x-vercel-forwarded-for"] ||
        req.socket.remoteAddress ||
        "local"
      ).toString(),
    );
  const now = Date.now();
  const old = await db.get(key);
  const rate = old && old.until > now ? old : { count: 0, until: now + 900000 };
  if (rate.count >= 10)
    throw fail("Muitas tentativas. Aguarde 15 minutos.", 429);
  await db.put("rate", key, { ...rate, count: rate.count + 1 });
  if (!process.env.STAFF_PASSWORD_HASH)
    throw fail("Acesso da equipe ainda não configurado.", 503);
  if (
    !equal(req.body.email || "", process.env.STAFF_EMAIL || "") ||
    !passwordMatches(
      String(req.body.password || ""),
      process.env.STAFF_PASSWORD_HASH,
    )
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
app.get("/api/auth/me", async (req, res) =>
  res.json({
    authenticated: !!(await staff(req)),
    email: (await staff(req)) ? process.env.STAFF_EMAIL : null,
  }),
);
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
  country: z.string().min(2).max(80),
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
app.get("/api/cases", requireStaff, async (req, res) =>
  res.json({
    cases: (await db.list("case"))
      .map(safeCase)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }),
);
app.get("/api/cases/:id", async (req, res) => {
  const c = await access(req, req.params.id);
  res.json({
    case: safeCase(c),
    evidence: (await db.list("evidence")).filter(
      (e) => e.caseId === c.id && e.uploaded,
    ),
    sessions: (await db.list("capture")).filter((s) => s.caseId === c.id),
    events: (await db.list("event")).filter((e) => e.caseId === c.id),
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
      size: z
        .number()
        .int()
        .positive()
        .max(1024 * 1024 * 1024),
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
  if (process.env.VERCEL || process.env.S3_BUCKET)
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
  res
    .status(status)
    .json({
      error:
        status === 500
          ? "Não foi possível concluir. Tente novamente."
          : err instanceof z.ZodError
            ? "Revise os campos obrigatórios e o formato dos dados."
            : err.message,
    });
});
export default app;