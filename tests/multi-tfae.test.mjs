import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomBytes, scryptSync } from "node:crypto";
import app from "../server/app-enhanced.mjs";

function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}

test("two TFAEs keep distinct identities and staff actions are attributed", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/aftercare-staff-");
  process.chdir(dir);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.STAFF_EMAIL;
  delete process.env.STAFF_PASSWORD_HASH;

  const gustavoPassword = "gustavo-test-password";
  const tommyPassword = "tommy-test-password";
  process.env.STAFF_USERS_JSON = JSON.stringify([
    { id: "gustavo", name: "Gustavo", email: "gustavo@example.com", market: "BR", country: "Brasil", passwordHash: passwordHash(gustavoPassword) },
    { id: "tommy", name: "Tommy", email: "tommy@example.com", market: "EC", country: "Ecuador", passwordHash: passwordHash(tommyPassword) },
  ]);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    const gustavoLogin = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "gustavo@example.com", password: gustavoPassword }),
    });
    assert.equal(gustavoLogin.status, 200);
    const gustavoBody = await gustavoLogin.json();
    assert.deepEqual(
      { id: gustavoBody.staff.id, name: gustavoBody.staff.name, market: gustavoBody.staff.market, country: gustavoBody.staff.country },
      { id: "gustavo", name: "Gustavo", market: "BR", country: "Brasil" },
    );
    const gustavoCookie = gustavoLogin.headers.get("set-cookie").split(";")[0];

    const tommyLogin = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "tommy@example.com", password: tommyPassword }),
    });
    assert.equal(tommyLogin.status, 200);
    const tommyBody = await tommyLogin.json();
    assert.equal(tommyBody.staff.name, "Tommy");
    assert.equal(tommyBody.staff.market, "EC");
    assert.equal(tommyBody.staff.country, "Ecuador");
    const tommyCookie = tommyLogin.headers.get("set-cookie").split(";")[0];

    const me = await fetch(base + "/api/auth/me", { headers: { Cookie: tommyCookie } });
    assert.equal(me.status, 200);
    const meBody = await me.json();
    assert.equal(meBody.staff.id, "tommy");

    const team = await fetch(base + "/api/auth/staff", { headers: { Cookie: gustavoCookie } });
    assert.equal(team.status, 200);
    const teamBody = await team.json();
    assert.deepEqual(teamBody.staff.map((user) => user.id).sort(), ["gustavo", "tommy"]);
    assert.ok(teamBody.staff.every((user) => !("passwordHash" in user)));

    const created = await fetch(base + "/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "infinix", model: "X6873", build: "", category: "software",
        problem: "Wi-Fi disconnects", description: "", expected: "Wi-Fi stays connected",
        name: "Customer", email: "customer@example.com", phone: "+55 11 99999-9999",
        country: "", postalCode: "", street: "", addressNumber: "", addressComplement: "",
        neighborhood: "", city: "", state: "", carrier: "", consent: true,
      }),
    });
    assert.equal(created.status, 201);
    const caseBody = await created.json();

    const patched = await fetch(base + "/api/cases/" + caseBody.case.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: gustavoCookie },
      body: JSON.stringify({ status: "reviewing", owner: "Gustavo", note: "Initial validation" }),
    });
    assert.equal(patched.status, 200);

    const detail = await fetch(base + "/api/cases/" + caseBody.case.id, {
      headers: { Authorization: "Bearer " + caseBody.accessToken },
    });
    const detailBody = await detail.json();
    const staffEvent = detailBody.events.find((event) => event.source === "staff");
    assert.equal(staffEvent.staffId, "gustavo");
    assert.equal(staffEvent.staffName, "Gustavo");
    assert.equal(staffEvent.staffMarket, "BR");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    delete process.env.STAFF_USERS_JSON;
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});
