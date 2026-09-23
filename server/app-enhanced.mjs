import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import baseApp from "./app.mjs";
import * as db from "./store.mjs";
import { token, hash, safeCase } from "./security.mjs";

const app = express();
app.disable("x-powered-by");

const CASE_RATE_WINDOW_MS = 15 * 60 * 1000;
const CASE_RATE_MAX = 30;

function requestAddress(req) {
  return (
    req.headers["x-vercel-forwarded-for"] ||
    req.ip ||
    req.socket.remoteAddress ||
    "local"
  ).toString().split(",")[0].trim();
}

async function checkCaseCreationRate(req) {
  const now = Date.now();
  const key = "case-rate-" + hash(requestAddress(req));
  const previous = await db.get(key);
  const rate = previous && previous.until > now
    ? previous
    : { count: 0, until: now + CASE_RATE_WINDOW_MS };
  if (rate.count >= CASE_RATE_MAX) {
    throw Object.assign(new Error("Muitas solicitações. Aguarde alguns minutos e tente novamente."), { status: 429 });
  }
  await db.put("rate", key, { ...rate, count: rate.count + 1 });
}

const hardwareRequired = (value, field, min, ctx) => {
  if (String(value[field] || "").trim().length < min) {
    ctx.addIssue({
      code: "custom",
      path: [field],
      message: "Campo obrigatório para atendimento de hardware.",
    });
  }
};

const caseSchema = z
  .object({
    brand: z.enum(["infinix", "tecno", "itel"]),
    model: z.string().trim().min(2).max(100),
    build: z.string().max(180).default(""),
    category: z.enum(["hardware", "software"]),
    problem: z.string().trim().min(5).max(180),
    description: z.string().trim().default(""),
    expected: z.string().max(1000).default(""),
    name: z.string().trim().min(2).max(100),
    email: z.email().max(180),
    phone: z.string().trim().min(6).max(30),
    country: z.string().trim().max(80).default(""),
    postalCode: z.string().trim().max(20).default(""),
    street: z.string().trim().max(180).default(""),
    addressNumber: z.string().trim().max(30).default(""),
    addressComplement: z.string().trim().max(120).default(""),
    neighborhood: z.string().trim().max(120).default(""),
    city: z.string().trim().max(100).default(""),
    state: z.string().trim().max(100).default(""),
    carrier: z.string().max(80).default(""),
    warrantyStatus: z.enum(["yes", "no", "unsure"]).default("unsure"),
    deviceIdentifier: z.string().trim().max(80).default(""),
    purchaseDate: z.string().trim().max(10).regex(/^$|^\d{4}-\d{2}-\d{2}$/).default(""),
    consent: z.literal(true),
  })
  .superRefine((value, ctx) => {
    if (value.category !== "hardware") return;
    hardwareRequired(value, "country", 2, ctx);
    hardwareRequired(value, "postalCode", 3, ctx);
    hardwareRequired(value, "street", 2, ctx);
    hardwareRequired(value, "addressNumber", 1, ctx);
    hardwareRequired(value, "city", 2, ctx);
    hardwareRequired(value, "state", 1, ctx);
  });

app.post("/api/cases", express.json({ limit: "64kb" }), async (req, res, next) => {
  try {
    await checkCaseCreationRate(req);
    const origin = req.headers.origin;
    if (
      origin &&
      origin !== process.env.APP_ORIGIN &&
      origin !== `http://${req.headers.host}` &&
      origin !== `https://${req.headers.host}`
    ) {
      return res.status(403).json({ error: "Origem não permitida." });
    }

    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });

    const input = caseSchema.parse(req.body);
    const id = "CAS-" + randomUUID();
    const accessToken = token();
    const customerCase = {
      ...input,
      id,
      kind: "case",
      status: "received",
      priority: "normal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessHash: hash(accessToken),
    };
    await db.put("case", id, customerCase);
    return res.status(201).json({ case: safeCase(customerCase), accessToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Revise os campos obrigatórios e o formato dos dados." });
    }
    return next(error);
  }
});

app.use(baseApp);

export default app;
