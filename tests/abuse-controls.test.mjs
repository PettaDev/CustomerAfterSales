import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";
import { encodeSecret } from "../server/security.mjs";

function softwareCase(seed) {
  return {
    brand: "infinix",
    model: "X6873",
    build: "",
    category: "software",
    problem: "Wi-Fi disconnects unexpectedly",
    description: "",
    expected: "Wi-Fi remains connected",
    carrier: "",
    name: "Customer " + seed,
    email: seed + "@example.com",
    phone: "+55 11 9" + String(10000000 + seed.length * 137),
    country: "",
    postalCode: "",
    street: "",
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
    city: "",
    state: "",
    warrantyStatus: "unsure",
    deviceIdentifier: "",
    purchaseDate: "",
    consent: true,
  };
}

async function json(response) {
  const body = await response.json();
  return { response, body };
}

test("BRTE limits repeated cases, duplicate evidence, upload windows and moderation queues", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/brte-abuse-controls-");
  process.chdir(dir);

  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
    STAFF_USERS_JSON: process.env.STAFF_USERS_JSON,
    STAFF_EMAIL: process.env.STAFF_EMAIL,
    STAFF_PASSWORD_HASH: process.env.STAFF_PASSWORD_HASH,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
  };

  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.RESEND_API_KEY;
  delete process.env.AUTH_EMAIL_FROM;
  delete process.env.STAFF_EMAIL;
  delete process.env.STAFF_PASSWORD_HASH;
  process.env.STAFF_USERS_JSON = JSON.stringify([
    {
      id: "gustavo",
      name: "Gustavo Petta",
      email: "gustavo@example.com",
      market: "BR",
      country: "Brasil",
      role: "tfae",
      passwordHash: encodeSecret("test-password-123"),
    },
  ]);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const call = (path, { method = "GET", body, token, cookie, ip = "203.0.113.10" } = {}) =>
    fetch(base + "/api" + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        "x-vercel-forwarded-for": ip,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  try {
    const created = await json(await call("/cases", { method: "POST", body: softwareCase("main") }));
    assert.equal(created.response.status, 201);
    const caseId = created.body.case.id;
    const accessToken = created.body.accessToken;
    assert.equal(created.body.case.moderationState, undefined);
    assert.ok(Date.parse(created.body.case.customerUploadUntil) > Date.now());

    const login = await call("/auth/login", {
      method: "POST",
      body: { email: "gustavo@example.com", password: "test-password-123" },
      ip: "203.0.113.200",
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];

    const fingerprint = "a".repeat(64);
    const firstEvidence = await call("/cases/" + caseId + "/evidence", {
      method: "POST",
      token: accessToken,
      body: { name: "video.mp4", type: "video/mp4", size: 100, fingerprint },
    });
    assert.equal(firstEvidence.status, 200);

    const duplicateEvidence = await json(await call("/cases/" + caseId + "/evidence", {
      method: "POST",
      token: accessToken,
      body: { name: "renamed.mp4", type: "video/mp4", size: 100, fingerprint },
    }));
    assert.equal(duplicateEvidence.response.status, 409);
    assert.equal(duplicateEvidence.body.code, "DUPLICATE_EVIDENCE");

    const reviewing = await call("/cases/" + caseId, {
      method: "PATCH",
      cookie,
      body: { status: "reviewing", note: "Review started" },
      ip: "203.0.113.200",
    });
    assert.equal(reviewing.status, 200);

    const closedUpload = await json(await call("/cases/" + caseId + "/evidence", {
      method: "POST",
      token: accessToken,
      body: { name: "later.jpg", type: "image/jpeg", size: 100, fingerprint: "b".repeat(64) },
    }));
    assert.equal(closedUpload.response.status, 409);
    assert.equal(closedUpload.body.code, "UPLOAD_WINDOW_CLOSED");

    const awaiting = await call("/cases/" + caseId, {
      method: "PATCH",
      cookie,
      body: { status: "awaiting_customer", note: "Please add one more photo." },
      ip: "203.0.113.200",
    });
    assert.equal(awaiting.status, 200);

    const reopened = await call("/cases/" + caseId + "/evidence", {
      method: "POST",
      token: accessToken,
      body: { name: "requested.jpg", type: "image/jpeg", size: 100, fingerprint: "c".repeat(64) },
    });
    assert.equal(reopened.status, 200);

    const spam = await call("/cases/" + caseId, {
      method: "PATCH",
      cookie,
      body: { moderationState: "spam", moderationReason: "Repeated unrelated submissions" },
      ip: "203.0.113.200",
    });
    assert.equal(spam.status, 200);

    const activeQueue = await json(await call("/cases?moderation=active", { cookie, ip: "203.0.113.200" }));
    assert.equal(activeQueue.body.cases.some((item) => item.id === caseId), false);
    const spamQueue = await json(await call("/cases?moderation=spam", { cookie, ip: "203.0.113.200" }));
    assert.equal(spamQueue.body.cases.some((item) => item.id === caseId), true);

    const customerDetail = await json(await call("/cases/" + caseId, { token: accessToken }));
    assert.equal(customerDetail.body.case.moderationState, undefined);
    assert.equal(customerDetail.body.case.moderationReason, undefined);
    assert.equal(customerDetail.body.case.owner, undefined);
    assert.equal(customerDetail.body.events.some((event) => event.visibility === "internal"), false);
    assert.equal(customerDetail.body.evidencePolicy.canUpload, false);

    const target = await json(await call("/cases", {
      method: "POST",
      body: softwareCase("target"),
      ip: "203.0.113.11",
    }));
    const duplicateCase = await json(await call("/cases", {
      method: "POST",
      body: softwareCase("duplicate"),
      ip: "203.0.113.12",
    }));
    const markDuplicate = await call("/cases/" + duplicateCase.body.case.id, {
      method: "PATCH",
      cookie,
      body: {
        moderationState: "duplicate",
        duplicateOfCaseId: target.body.case.id,
        moderationReason: "Same device and issue",
      },
      ip: "203.0.113.200",
    });
    assert.equal(markDuplicate.status, 200);
    const duplicateQueue = await json(await call("/cases?moderation=duplicate", { cookie, ip: "203.0.113.200" }));
    assert.equal(duplicateQueue.body.cases.some((item) => item.id === duplicateCase.body.case.id), true);

    const quota = await json(await call("/cases", {
      method: "POST",
      body: softwareCase("quota"),
      ip: "203.0.113.13",
    }));
    for (let i = 0; i < 15; i += 1) {
      const reservation = await call("/cases/" + quota.body.case.id + "/evidence", {
        method: "POST",
        token: quota.body.accessToken,
        body: {
          name: "evidence-" + i + ".jpg",
          type: "image/jpeg",
          size: 100,
          fingerprint: i.toString(16).padStart(64, "0"),
        },
      });
      assert.equal(reservation.status, 200, "reservation " + i);
    }
    const overQuota = await json(await call("/cases/" + quota.body.case.id + "/evidence", {
      method: "POST",
      token: quota.body.accessToken,
      body: {
        name: "too-many.jpg",
        type: "image/jpeg",
        size: 100,
        fingerprint: "f".repeat(64),
      },
    }));
    assert.equal(overQuota.response.status, 413);
    assert.equal(overQuota.body.code, "EVIDENCE_QUOTA");

    for (let i = 0; i < 5; i += 1) {
      const rateBody = softwareCase("ratelimit");
      const response = await call("/cases", {
        method: "POST",
        body: rateBody,
        ip: "203.0.113.50",
      });
      assert.equal(response.status, 201, "allowed customer case " + i);
    }
    const rateLimited = await json(await call("/cases", {
      method: "POST",
      body: softwareCase("ratelimit"),
      ip: "203.0.113.50",
    }));
    assert.equal(rateLimited.response.status, 429);
    assert.equal(rateLimited.body.code, "CASE_RATE_LIMIT");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("abuse-control UX is localized and large-file fingerprinting samples the file", async () => {
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const flow = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");
  const api = await readFile(new URL("../src/portal/api.ts", import.meta.url), "utf8");
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");

  for (const marker of [
    "Meus casos", "My cases", "Mis casos", "我的服务单",
    "Arquivados", "Archived", "Archivados", "已归档",
    "Este arquivo já foi enviado", "This file has already been sent", "Este archivo ya fue enviado", "此文件已在本服务单中提交",
  ]) assert.ok(ui.includes(marker), "missing localized abuse-control copy: " + marker);

  assert.match(flow, /EVIDENCE_MAX_FILES = 15/);
  assert.match(flow, /EVIDENCE_MAX_BYTES = 3 \* 1024 \*\* 3/);
  assert.match(api, /const chunk = 64 \* 1024/);
  assert.match(api, /Math\.floor\(file\.size \/ 2\)/);
  assert.match(cases, /moderationFilter/);
  assert.match(cases, /duplicateOfCaseId/);
});
