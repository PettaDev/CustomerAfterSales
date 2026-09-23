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
const CUSTOMER_CASE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CUSTOMER_CASE_MAX = 5;
const INITIAL_UPLOAD_WINDOW_MS = 2 * 60 * 60 * 1000;

function requestAddress(req) {
  return (
    req.headers["x-vercel-forwarded-for"] ||
    req.ip ||
    req.socket.remoteAddress ||
    "local"
  ).toString().split(",")[0].trim();
}

async function consumeCaseRate(key, max, windowMs) {
  const now = Date.now();
  const previous = await db.get(key);
  const rate = previous && previous.until > now
    ? previous
    : { count: 0, until: now + windowMs };
  if (rate.count >= max) {
    throw Object.assign(
      new Error("Muitas solicitações. Aguarde antes de criar outro atendimento."),
      { status: 429, code: "CASE_RATE_LIMIT" },
    );
  }
  await db.put("rate", key, { ...rate, count: rate.count + 1 });
}

async function checkCaseCreationRate(req) {
  await consumeCaseRate(
    "case-rate-" + hash(requestAddress(req)),
    CASE_RATE_MAX,
    CASE_RATE_WINDOW_MS,
  );
}

async function checkCustomerCaseRate(input) {
  const normalizedEmail = String(input.email || "").trim().toLowerCase();
  const normalizedPhone = String(input.phone || "").replace(/\D/g, "");
  await consumeCaseRate(
    "case-customer-" + hash(normalizedEmail + "|" + normalizedPhone),
    CUSTOMER_CASE_MAX,
    CUSTOMER_CASE_WINDOW_MS,
  );
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
    await checkCustomerCaseRate(input);
    const id = "CAS-" + randomUUID();
    const accessToken = token();
    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    const customerCase = {
      ...input,
      id,
      kind: "case",
      status: "received",
      priority: "normal",
      moderationState: "active",
      customerUploadUntil: new Date(now + INITIAL_UPLOAD_WINDOW_MS).toISOString(),
      createdAt,
      updatedAt: createdAt,
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

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error?.status || 500).json({
    error: error?.status ? error.message : "Não foi possível concluir. Tente novamente.",
    ...(error?.code ? { code: error.code } : {}),
  });
});

export default app;
