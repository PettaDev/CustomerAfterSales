import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomBytes, scryptSync } from "node:crypto";
import app from "../server/app-enhanced.mjs";

function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}

async function login(base, email, password) {
  const response = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return {
    body: await response.json(),
    cookie: response.headers.get("set-cookie").split(";")[0],
  };
}

test("manager can monitor, assign and update cases without technical capture rights", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/aftercare-manager-");
  process.chdir(dir);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.STAFF_EMAIL;
  delete process.env.STAFF_PASSWORD_HASH;

  process.env.STAFF_USERS_JSON = JSON.stringify([
    { id: "analyst-br", name: "Analyst BR", email: "analyst.br@example.com", market: "BR", country: "Brasil", role: "tfae", passwordHash: makeHash("analyst-br-password") },
    { id: "analyst-ec", name: "Analyst EC", email: "analyst.ec@example.com", market: "EC", country: "Ecuador", role: "tfae", passwordHash: makeHash("analyst-ec-password") },
    { id: "manager-cn", name: "Manager CN", email: "manager.cn@example.com", market: "CN", country: "China", role: "manager", passwordHash: makeHash("manager-cn-password") },
  ]);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    const analyst = await login(base, "analyst.br@example.com", "analyst-br-password");
    const manager = await login(base, "manager.cn@example.com", "manager-cn-password");
    assert.equal(analyst.body.staff.role, "tfae");
    assert.equal(manager.body.staff.role, "manager");

    const team = await fetch(base + "/api/auth/staff", { headers: { Cookie: manager.cookie } });
    assert.equal(team.status, 200);
    const teamBody = await team.json();
    assert.deepEqual(
      teamBody.staff.map((user) => [user.id, user.role]).sort(),
      [["analyst-br", "tfae"], ["analyst-ec", "tfae"], ["manager-cn", "manager"]],
    );
    assert.ok(teamBody.staff.every((user) => !("passwordHash" in user)));

    const created = await fetch(base + "/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "infinix",
        model: "X6873",
        build: "",
        category: "software",
        problem: "Wi-Fi disconnects",
        description: "",
        expected: "Wi-Fi stays connected",
        carrier: "",
        name: "Customer",
        email: "customer@example.com",
        phone: "+55 11 99999-9999",
        country: "",
        postalCode: "",
        street: "",
        addressNumber: "",
        addressComplement: "",
        neighborhood: "",
        city: "",
        state: "",
        consent: true,
      }),
    });
    assert.equal(created.status, 201);
    const caseBody = await created.json();

    const managerList = await fetch(base + "/api/cases", { headers: { Cookie: manager.cookie } });
    assert.equal(managerList.status, 200);

    const managerPatch = await fetch(base + "/api/cases/" + caseBody.case.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: manager.cookie },
      body: JSON.stringify({ status: "reviewing", owner: "Manager CN", priority: "high", note: "Manager triage" }),
    });
    assert.equal(managerPatch.status, 200);
    const managerOverview = await fetch(base + "/api/auth/staff-overview", { headers: { Cookie: manager.cookie } });
    assert.equal(managerOverview.status, 200);
    const managerWorkload = (await managerOverview.json()).staff.find((member) => member.id === "manager-cn");
    assert.equal(managerWorkload.active, 1);
    assert.equal(managerWorkload.assigned, 1);

    const managerEvidence = await fetch(base + "/api/cases/" + caseBody.case.id + "/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: manager.cookie },
      body: JSON.stringify({ name: "manager.txt", type: "text/plain", size: 10 }),
    });
    assert.equal(managerEvidence.status, 403);

    // Manager accounts must not create capture sessions (even though they can read cases).
    const managerSession = await fetch(base + "/api/cases/" + caseBody.case.id + "/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: manager.cookie },
      body: JSON.stringify({
        id: "8e65f7e8-3ceb-47a9-8873-2f23d3068901",
        status: "complete",
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        device: { brand: "infinix", model: "X6873", build: "", platform: "MTK" },
      }),
    });
    assert.equal(managerSession.status, 403);

    // Completing an existing evidence upload also requires write authorization.
    const pendingEvidence = await fetch(base + "/api/cases/" + caseBody.case.id + "/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + caseBody.accessToken },
      body: JSON.stringify({ name: "sample.png", type: "image/png", size: 16 }),
    });
    assert.equal(pendingEvidence.status, 200);
    const pending = await pendingEvidence.json();
    const managerComplete = await fetch(base + "/api/evidence/" + pending.id + "/complete", {
      method: "POST",
      headers: { Cookie: manager.cookie },
    });
    assert.equal(managerComplete.status, 403);

    // Removing a staff member must immediately invalidate their existing session.
    const previousAllowlist = process.env.STAFF_USERS_JSON;
    process.env.STAFF_USERS_JSON = JSON.stringify(
      JSON.parse(previousAllowlist).filter((item) => item.id !== "manager-cn"),
    );
    const removedManager = await fetch(base + "/api/auth/me", {
      headers: { Cookie: manager.cookie },
    });
    assert.equal(removedManager.status, 200);
    assert.equal((await removedManager.json()).authenticated, false);
    process.env.STAFF_USERS_JSON = previousAllowlist;

    const invalidOwner = await fetch(base + "/api/cases/" + caseBody.case.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: analyst.cookie },
      body: JSON.stringify({ owner: "Outside Staff" }),
    });
    assert.equal(invalidOwner.status, 400);

    const analystPatch = await fetch(base + "/api/cases/" + caseBody.case.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: analyst.cookie },
      body: JSON.stringify({ status: "reviewing", owner: "Analyst BR", note: "Initial validation" }),
    });
    assert.equal(analystPatch.status, 200);

    const overview = await fetch(base + "/api/auth/staff-overview", { headers: { Cookie: manager.cookie } });
    assert.equal(overview.status, 200);
    const overviewBody = await overview.json();
    const brOverview = overviewBody.staff.find((item) => item.id === "analyst-br");
    assert.equal(brOverview.assigned, 1);
    assert.equal(brOverview.active, 1);
    assert.equal(overviewBody.staff.length, 3);
    assert.ok(overviewBody.staff.some((item) => item.id === "manager-cn" && item.role === "manager"));

    const detail = await fetch(base + "/api/cases/" + caseBody.case.id, {
      headers: { Authorization: "Bearer " + caseBody.accessToken },
    });
    assert.equal(detail.status, 200);
    const detailBody = await detail.json();
    assert.equal(detailBody.case.phone, "+55 11 99999-9999");
    const managerEvent = detailBody.events.find((item) => item.staffRole === "manager");
    const analystEvent = detailBody.events.find((item) => item.staffRole === "tfae");
    assert.equal(managerEvent.staffName, "Manager CN");
    assert.equal(analystEvent.staffName, "Analyst BR");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    delete process.env.STAFF_USERS_JSON;
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("manager operational controls, customer contact and workload cards are available", async () => {
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const setup = await readFile(new URL("../scripts/setup-staff.mjs", import.meta.url), "utf8");

  assert.match(cases, /staffProfile\?\.role === "manager"/);
  assert.match(cases, /staffProfile\?\.role === "tfae"/);
  assert.match(cases, /member\.role === "tfae" \|\| member\.role === "manager"/);
  assert.match(cases, /staff-overview-metrics/);
  assert.match(cases, /ui\.phone/);
  assert.doesNotMatch(cases, /managerReadOnlyTitle/);
  assert.match(setup, /Perfil \(tfae\/manager\)/);

  for (const marker of [
    'phone: "Telefone"',
    'phone: "Phone"',
    'phone: "Teléfono"',
    'phone: "联系电话"',
    "Acompanhamento dos TFAEs",
    "TFAE monitoring",
    "Seguimiento de los TFAE",
    "TFAE 跟进概览",
  ]) assert.ok(ui.includes(marker), "missing manager copy: " + marker);
});
