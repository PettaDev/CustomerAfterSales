import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";

function softwareCase(email = "customer@example.com") {
  return {
    brand: "infinix",
    model: "X6873",
    build: "",
    category: "software",
    problem: "Wi-Fi disconnects",
    description: "",
    expected: "Wi-Fi stays connected",
    carrier: "",
    name: "Customer",
    email,
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
  };
}

function hardwareCase() {
  return {
    ...softwareCase("hardware@example.com"),
    category: "hardware",
    problem: "Device does not charge",
    expected: "",
    country: "Brasil",
    postalCode: "01001-000",
    street: "Praça da Sé",
    addressNumber: "1",
    city: "São Paulo",
    state: "SP",
  };
}

test("root navigation, BRTE footer credit and team access stay discoverable in all languages", async () => {
  const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const i18n = await readFile(new URL("../src/portal/portal-i18n.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/portal/portal.css", import.meta.url), "utf8");

  assert.match(appSource, /location\.pathname === "\/" \? "customer"/);
  assert.match(appSource, /href="\/dashboard"/);
  assert.match(appSource, /tx\("teamAccess"\)/);
  assert.match(appSource, /tx\("developerCredit"\)/);
  assert.match(css, /\.developer-credit/);
  assert.match(css, /\.footer-links/);

  for (const marker of [
    "Área da equipe / TFAE",
    "Team area / TFAE",
    "Área del equipo / TFAE",
    "团队区域 / TFAE",
    "Desenvolvido por Gustavo Petta",
    "Developed by Gustavo Petta",
    "Desarrollado por Gustavo Petta",
    "由 Gustavo Petta 开发",
  ]) assert.ok(i18n.includes(marker), "missing footer localization: " + marker);
});

test("hardware evidence types are enforced server-side", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/brte-hardware-evidence-");
  process.chdir(dir);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    const created = await fetch(base + "/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": "203.0.113.10" },
      body: JSON.stringify(hardwareCase()),
    });
    assert.equal(created.status, 201);
    const body = await created.json();

    const zip = await fetch(base + "/api/cases/" + body.case.id + "/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + body.accessToken,
      },
      body: JSON.stringify({
        name: "logs.zip",
        type: "application/zip",
        size: 1024,
      }),
    });
    assert.equal(zip.status, 400);
    const zipBody = await zip.json();
    assert.match(zipBody.error, /hardware/i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("anonymous case creation is rate-limited before public rollout", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/brte-rate-limit-");
  process.chdir(dir);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    for (let index = 0; index < 30; index += 1) {
      const response = await fetch(base + "/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": "203.0.113.77" },
        body: JSON.stringify(softwareCase("customer" + index + "@example.com")),
      });
      assert.equal(response.status, 201, "request " + (index + 1) + " should be accepted");
    }

    const blocked = await fetch(base + "/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": "203.0.113.77" },
      body: JSON.stringify(softwareCase("blocked@example.com")),
    });
    assert.equal(blocked.status, 429);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("TFAE emergency fallback UX is localized and only exposed by server config", async () => {
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const appSource = await readFile(new URL("../server/app.mjs", import.meta.url), "utf8");

  assert.match(cases, /authConfig\.passwordFallback/);
  assert.match(cases, /loginStep === "code"/);
  assert.match(cases, /setLoginStep\("password"\)/);
  assert.match(appSource, /AUTH_ALLOW_PASSWORD_FALLBACK === "true"/);

  for (const marker of [
    "Acesso de contingência TFAE",
    "TFAE emergency access",
    "Acceso de contingencia TFAE",
    "TFAE 应急访问",
  ]) assert.ok(ui.includes(marker), "missing emergency access localization: " + marker);
});
