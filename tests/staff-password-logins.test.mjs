import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";
import { encodeSecret } from "../server/security.mjs";

test("password fallback accepts configured staff usernames with distinct roles", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/brte-staff-logins-");
  process.chdir(dir);

  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
    AUTH_ALLOW_PASSWORD_FALLBACK: process.env.AUTH_ALLOW_PASSWORD_FALLBACK,
    STAFF_EMAIL: process.env.STAFF_EMAIL,
    STAFF_PASSWORD_HASH: process.env.STAFF_PASSWORD_HASH,
    STAFF_USERS_JSON: process.env.STAFF_USERS_JSON,
  };

  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.RESEND_API_KEY;
  delete process.env.AUTH_EMAIL_FROM;
  process.env.AUTH_ALLOW_PASSWORD_FALLBACK = "true";
  delete process.env.STAFF_EMAIL;
  delete process.env.STAFF_PASSWORD_HASH;
  process.env.STAFF_USERS_JSON = JSON.stringify([
    { id: "gustavo", name: "Gustavo Petta", email: "gustavo@example.com", market: "BR", country: "Brasil", role: "tfae", passwordHash: encodeSecret("gustavo-password-123") },
    { id: "tommy", name: "Tommy Alvarado", email: "tommy@example.com", market: "EC", country: "Ecuador", role: "tfae", passwordHash: encodeSecret("tommy-password-123") },
    { id: "haoxin", name: "Xin Hao (Leonard)", email: "haoxin@example.com", market: "CN", country: "China", role: "manager", passwordHash: encodeSecret("haoxin-password-123") },
  ]);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    for (const expected of [
      ["gustavo", "gustavo-password-123", "tfae"],
      ["tommy", "tommy-password-123", "tfae"],
      ["haoxin", "haoxin-password-123", "manager"],
    ]) {
      const response = await fetch(base + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": "203.0.113." + (10 + expected[0].length) },
        body: JSON.stringify({ email: expected[0], password: expected[1] }),
      });
      assert.equal(response.status, 200, expected[0] + " should log in");
      const body = await response.json();
      assert.equal(body.staff.id, expected[0]);
      assert.equal(body.staff.role, expected[2]);
    }

    const byEmail = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": "203.0.113.99" },
      body: JSON.stringify({ email: "gustavo@example.com", password: "gustavo-password-123" }),
    });
    assert.equal(byEmail.status, 200);
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
