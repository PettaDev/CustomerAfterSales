import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { scryptSync, randomUUID } from "node:crypto";
import app from "../server/app.mjs";

const caseBody = (suffix) => ({
  brand: "infinix",
  model: `Audit Model ${suffix}`,
  build: `AUDIT-${suffix}`,
  category: "software",
  problem: `Security audit case ${suffix}`,
  description: `Reproduction steps for security audit case ${suffix}.`,
  expected: "The case remains isolated from other customer tokens.",
  carrier: "N/A",
  name: `Audit User ${suffix}`,
  email: `audit-${suffix}@example.com`,
  phone: "+55 11 90000-0000",
  country: "Brasil",
  postalCode: "01001-000",
  street: "Praça da Sé",
  addressNumber: "1",
  addressComplement: "",
  neighborhood: "Sé",
  city: "São Paulo",
  state: "SP",
  consent: true,
});

test("security audit: object routes enforce case ownership and staff privilege", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/aftercare-security-");
  process.chdir(dir);
  process.env.STAFF_EMAIL = "security@example.com";
  process.env.STAFF_PASSWORD_HASH =
    "audit-salt:" + scryptSync("audit-test-password", "audit-salt", 64).toString("hex");

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const call = (path, { method = "GET", body, token, cookie, origin } = {}) =>
    fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  try {
    const aResponse = await call("/cases", { method: "POST", body: caseBody("a") });
    const bResponse = await call("/cases", { method: "POST", body: caseBody("b") });
    assert.equal(aResponse.status, 201);
    assert.equal(bResponse.status, 201);
    const a = await aResponse.json();
    const b = await bResponse.json();

    // Case object ownership.
    assert.equal((await call(`/cases/${a.case.id}`, { token: b.accessToken })).status, 403);
    assert.equal((await call(`/cases/${a.case.id}`, { token: a.accessToken })).status, 200);

    // Global listing and privileged mutation are staff-only, even with a valid customer token.
    assert.equal((await call("/cases", { token: a.accessToken })).status, 401);
    assert.equal((await call(`/cases/${a.case.id}`, {
      method: "PATCH",
      token: a.accessToken,
      body: { status: "resolved" },
    })).status, 401);

    // Evidence registration is case-token isolated.
    assert.equal((await call(`/cases/${a.case.id}/evidence`, {
      method: "POST",
      token: b.accessToken,
      body: { name: "audit.txt", type: "text/plain", size: 5 },
    })).status, 403);
    const evidence = await (await call(`/cases/${a.case.id}/evidence`, {
      method: "POST",
      token: a.accessToken,
      body: { name: "audit.txt", type: "text/plain", size: 5 },
    })).json();

    // The local upload endpoint requires the object-specific upload token.
    assert.equal((await fetch(base + evidence.url, { method: "PUT", body: "hello" })).status, 403);
    assert.equal((await fetch(base + evidence.url, {
      method: "PUT",
      headers: { Authorization: "Bearer " + evidence.uploadToken },
      body: "hello",
    })).status, 200);

    // Evidence complete/download derive ownership from evidence.caseId and reject another case token.
    assert.equal((await call(`/evidence/${evidence.id}/complete`, {
      method: "POST",
      token: b.accessToken,
      body: {},
    })).status, 403);
    assert.equal((await call(`/evidence/${evidence.id}/complete`, {
      method: "POST",
      token: a.accessToken,
      body: {},
    })).status, 200);
    assert.equal((await call(`/evidence/${evidence.id}/download`, { token: b.accessToken })).status, 403);
    assert.equal((await call(`/evidence/${evidence.id}/download`, { token: a.accessToken })).status, 200);

    // Capture sessions are also case-token isolated.
    const session = {
      id: randomUUID(),
      status: "complete",
      startedAt: new Date(Date.now() - 1000).toISOString(),
      endedAt: new Date().toISOString(),
      device: { brand: "infinix", model: "Audit", build: "AUDIT", platform: "MTK" },
    };
    assert.equal((await call(`/cases/${a.case.id}/sessions`, {
      method: "POST",
      token: b.accessToken,
      body: session,
    })).status, 403);
    assert.equal((await call(`/cases/${a.case.id}/sessions`, {
      method: "POST",
      token: a.accessToken,
      body: session,
    })).status, 200);

    // Mutating API requests with an explicit foreign Origin are rejected.
    assert.equal((await call("/cases", {
      method: "POST",
      body: caseBody("origin"),
      origin: "https://evil.example",
    })).status, 403);

    // Staff session can list and mutate, proving the server-side privilege gate rather than UI-only enforcement.
    const login = await call("/auth/login", {
      method: "POST",
      body: { email: "security@example.com", password: "audit-test-password" },
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await call("/cases", { cookie })).status, 200);
    assert.equal((await call(`/cases/${a.case.id}`, {
      method: "PATCH",
      cookie,
      body: { priority: "high", note: "Security audit authorized update" },
    })).status, 200);
  } finally {
    server.close();
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});
