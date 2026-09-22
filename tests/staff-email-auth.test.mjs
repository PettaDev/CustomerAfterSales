import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";

test("staff email codes support passwordless login and 7-day trusted devices", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/aftercare-email-auth-");
  process.chdir(dir);

  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  process.env.AUTH_EMAIL_PROVIDER = "test";
  delete process.env.RESEND_API_KEY;
  delete process.env.AUTH_EMAIL_FROM;
  delete process.env.AUTH_ALLOW_PASSWORD_FALLBACK;
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.STAFF_EMAIL;
  delete process.env.STAFF_PASSWORD_HASH;
  process.env.STAFF_USERS_JSON = JSON.stringify([
    { id: "gustavo", name: "Gustavo", email: "gustavo@example.com", market: "BR", country: "Brasil", role: "tfae" },
    { id: "leonard", name: "Leonard", email: "leonard@example.com", market: "CN", country: "China", role: "manager" },
  ]);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    const config = await fetch(base + "/api/auth/config");
    assert.equal(config.status, 200);
    assert.deepEqual(await config.json(), {
      emailCode: true,
      passwordFallback: false,
      trustedDeviceDays: 7,
    });

    const unknownRequest = await fetch(base + "/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com", language: "en" }),
    });
    assert.equal(unknownRequest.status, 202);
    const unknownBody = await unknownRequest.json();
    assert.equal(unknownBody.ok, true);
    assert.equal("debugCode" in unknownBody, false);

    const request = await fetch(base + "/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "gustavo@example.com", language: "pt-BR" }),
    });
    assert.equal(request.status, 202);
    const requestBody = await request.json();
    assert.match(requestBody.debugCode, /^\d{6}$/);
    assert.equal(requestBody.expiresInSeconds, 600);
    assert.equal(requestBody.retryAfterSeconds, 60);

    const wrong = await fetch(base + "/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "gustavo@example.com",
        code: requestBody.debugCode === "000000" ? "000001" : "000000",
        trustDevice: false,
      }),
    });
    assert.equal(wrong.status, 401);

    const verified = await fetch(base + "/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "gustavo@example.com",
        code: requestBody.debugCode,
        trustDevice: false,
      }),
    });
    assert.equal(verified.status, 200);
    const verifiedBody = await verified.json();
    assert.equal(verifiedBody.staff.id, "gustavo");
    assert.equal(verifiedBody.staff.role, "tfae");
    assert.equal(verifiedBody.trustedUntil, null);
    const shortCookie = verified.headers.get("set-cookie");
    assert.ok(shortCookie?.includes("tfae="));
    assert.equal(/Max-Age=/i.test(shortCookie || ""), false);

    const reused = await fetch(base + "/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "gustavo@example.com",
        code: requestBody.debugCode,
        trustDevice: false,
      }),
    });
    assert.equal(reused.status, 401);

    const managerRequest = await fetch(base + "/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "leonard@example.com", language: "zh-CN" }),
    });
    assert.equal(managerRequest.status, 202);
    const managerRequestBody = await managerRequest.json();

    const managerVerified = await fetch(base + "/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "leonard@example.com",
        code: managerRequestBody.debugCode,
        trustDevice: true,
      }),
    });
    assert.equal(managerVerified.status, 200);
    const managerBody = await managerVerified.json();
    assert.equal(managerBody.staff.role, "manager");
    assert.ok(managerBody.trustedUntil > Date.now() + 6 * 24 * 60 * 60 * 1000);
    const trustedCookie = managerVerified.headers.get("set-cookie") || "";
    assert.match(trustedCookie, /Max-Age=604800/i);
    assert.match(trustedCookie, /HttpOnly/i);
    assert.match(trustedCookie, /SameSite=Strict/i);

    const managerCookie = trustedCookie.split(";")[0];
    const me = await fetch(base + "/api/auth/me", { headers: { Cookie: managerCookie } });
    assert.equal(me.status, 200);
    const meBody = await me.json();
    assert.equal(meBody.staff.id, "leonard");
    assert.equal(meBody.staff.role, "manager");

    const legacyPassword = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "gustavo@example.com", password: "anything" }),
    });
    assert.equal(legacyPassword.status, 409);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    delete process.env.AUTH_EMAIL_PROVIDER;
    delete process.env.STAFF_USERS_JSON;
    delete process.env.AUTH_ALLOW_PASSWORD_FALLBACK;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("passwordless staff UX and e-mail copy are localized in four languages", async () => {
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const email = await readFile(new URL("../server/email.mjs", import.meta.url), "utf8");
  const setup = await readFile(new URL("../scripts/setup-staff.mjs", import.meta.url), "utf8");

  assert.match(cases, /\/auth\/request-code/);
  assert.match(cases, /\/auth\/verify-code/);
  assert.match(cases, /autoComplete="one-time-code"/);
  assert.match(cases, /trustDevice/);
  assert.match(cases, /loginStep/);
  assert.doesNotMatch(setup, /Senha \(mínimo/);
  assert.doesNotMatch(setup, /passwordHash/);

  for (const marker of [
    "Confiar neste dispositivo por 7 dias",
    "Trust this device for 7 days",
    "Confiar en este dispositivo durante 7 días",
    "信任此设备 7 天",
    "O código expira em 10 minutos",
    "The code expires in 10 minutes",
    "El código vence en 10 minutos",
    "验证码将在 10 分钟后过期",
  ]) {
    assert.ok(ui.includes(marker) || email.includes(marker), "missing localized passwordless copy: " + marker);
  }
});
