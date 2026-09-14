import express from "express";
import { createReadStream } from "node:fs";
import { randomBytes } from "node:crypto";
import { stat } from "node:fs/promises";
import { CaptureEngine } from "./core.mjs";
import { equal } from "../server/security.mjs";
const app = express(),
  engine = new CaptureEngine();
await engine.restore();
const key = randomBytes(32).toString("hex"),
  origin = process.env.APP_ORIGIN || "http://localhost:5173";
app.use((req, res, next) => {
  if (req.headers.host !== "127.0.0.1:43127") return res.sendStatus(403);
  if (req.headers.origin && req.headers.origin !== origin)
    return res.sendStatus(403);
  res.set({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Private-Network": "true",
    "Cache-Control": "no-store",
  });
  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (!equal(req.headers.authorization, "Bearer " + key))
    return res
      .status(401)
      .json({ error: "Cole o código exibido pelo Support Bridge." });
  next();
});
app.use(express.json({ limit: "8kb" }));
app.get("/health", async (req, res) => {
  await engine.check();
  res.json({ ok: true });
});
app.get("/devices", async (req, res) => {
  await engine.check();
  res.json({ devices: await engine.devices() });
});
app.get("/devices/:serial", async (req, res) =>
  res.json(await engine.device(req.params.serial)),
);
app.get("/sessions", (req, res) =>
  res.json({ sessions: [...engine.sessions.values()] }),
);
app.post("/start", async (req, res) => {
  await engine.check();
  res.json(await engine.start(req.body.serial, req.body.ylogStarted === true));
});
app.post("/sessions/:id/stop", async (req, res) =>
  res.json(await engine.stop(req.params.id, req.body.ylogStopped === true)),
);
app.post("/mirror", async (req, res) => {
  await engine.check();
  await engine.device(req.body.serial);
  engine.mirror(req.body.serial);
  res.json({ ok: true });
});
app.post("/sessions/:id/upload", async (req, res) => {
  const s = engine.sessions.get(req.params.id);
  if (!s?.packagePath || !["complete", "partial", "failed"].includes(s.status))
    throw Error("Pacote indisponível.");
  const caseId = req.body.caseId,
    t = req.body.accessToken;
  if (
    !/^CAS-[a-f0-9-]{36}$/.test(caseId) ||
    typeof t !== "string" ||
    !/^[a-f0-9]{64}$/.test(t)
  )
    throw Error("Caso ou código inválido.");
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + t,
  };
  const call = async (route, data) => {
    const r = await fetch(origin + "/api/" + route, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000),
    });
    const b = await r.json();
    if (!r.ok) throw Error(b.error || "Envio falhou.");
    return b;
  };
  try {
    await call(`cases/${caseId}/sessions`, {
      id: s.id,
      status: s.status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      device: s.device,
      reason: s.reason,
    });
    const e = await call(`cases/${caseId}/evidence`, {
      name: s.id + ".zip",
      type: "application/zip",
      size: (await stat(s.packagePath)).size,
      sessionId: s.id,
    });
    const u = new URL(e.url, origin);
    if (!["http:", "https:"].includes(u.protocol))
      throw Error("URL de envio inválida.");
    const r = await fetch(u, {
      method: "PUT",
      headers: {
        "Content-Type": "application/zip",
        ...(u.origin === origin
          ? { Authorization: "Bearer " + e.uploadToken }
          : {}),
      },
      body: createReadStream(s.packagePath),
      duplex: "half",
      signal: AbortSignal.timeout(600000),
    });
    if (!r.ok) throw Error("Transferência incompleta. Tente novamente.");
    await call(`evidence/${e.id}/complete`, {});
    s.uploaded = true;
    s.caseId = caseId;
    delete s.uploadError;
    await engine.persist(s);
    res.json({ ok: true });
  } catch (e) {
    s.uploadError = e.message;
    await engine.persist(s);
    throw e;
  }
});
app.use((err, req, res, next) => res.status(400).json({ error: err.message }));
let monitoring = false;
setInterval(async () => {
  if (monitoring) return;
  monitoring = true;
  try {
    await engine.monitor();
  } finally {
    monitoring = false;
  }
}, 3000).unref();
app.listen(43127, "127.0.0.1", () =>
  console.log(
    "Support Bridge · " +
      origin +
      "\nCódigo de conexão (não compartilhe): " +
      key,
  ),
);
