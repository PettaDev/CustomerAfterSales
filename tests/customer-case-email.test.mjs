import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as db from "../server/store.mjs";
import app from "../server/app-enhanced.mjs";
import {
  caseConfirmationConfigured, buildCaseConfirmationText, notifyCaseCreated,
} from "../server/case-email.mjs";

const emailFields = [
  "CASE_EMAIL_ENABLED", "CASE_EMAIL_FROM", "CASE_TRACKING_URL",
  "RESEND_API_KEY", "DATABASE_URL", "VERCEL",
];

function sampleCase(seed, language = "pt-BR") {
  return {
    brand: "infinix", model: "X6891", build: "SW-TEST", category: "software",
    problem: "Camera app closes on launch",
    description: "Reproduced in test setup", expected: "Camera remains open",
    name: "Test Customer " + seed, email: "customer-" + seed + "@example.test",
    phone: "+55 11 998888" + String(seed).padStart(4, "0"),
    country: "", postalCode: "", street: "", addressNumber: "",
    carrier: "", consent: true, notificationLanguage: language,
  };
}

test("localized customer confirmation keeps tokens out of URLs and requires explicit opt-in", async () => {
  const previous = Object.fromEntries(emailFields.map(key => [key, process.env[key]]));
  try {
    delete process.env.CASE_EMAIL_ENABLED;
    process.env.RESEND_API_KEY = "fake-key";
    process.env.CASE_EMAIL_FROM = "BRTE <case@example.test>";
    process.env.CASE_TRACKING_URL = "https://brteportal.com.br/tracking";
    assert.equal(caseConfirmationConfigured(), false);
    assert.equal(await notifyCaseCreated({
      to: "customer@example.test", protocol: "CAS-test", accessToken: "secret", language: "pt-BR",
    }), "disabled");
    process.env.CASE_EMAIL_ENABLED = "true";
    assert.equal(caseConfirmationConfigured(), true);
    process.env.CASE_TRACKING_URL = "http://evil.example/tracking?token=bad";
    assert.equal(caseConfirmationConfigured(), false);
    process.env.CASE_TRACKING_URL = "https://brteportal.com.br/tracking";
    for (const language of ["pt-BR", "en", "es-419", "zh-CN"]) {
      const message = buildCaseConfirmationText({
        protocol: "CAS-TEST", accessToken: "PRIVATE-TEST-ACCESS", language,
        url: "https://brteportal.com.br/tracking",
      });
      assert.ok(message.includes("CAS-TEST"));
      assert.ok(message.includes("PRIVATE-TEST-ACCESS"));
      assert.ok(message.includes("https://brteportal.com.br/tracking"));
      assert.doesNotMatch(message, /tracking\?[^ \n]+/);
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("creating a case persists first, sends one email, and still succeeds if Resend fails", async () => {
  const previous = Object.fromEntries(emailFields.map(key => [key, process.env[key]]));
  const oldFetch = globalThis.fetch, oldInfo = console.info, oldError = console.error, cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/brte-case-email-");
  let server;
  const messages = [], logs = [];
  let failProvider = false;
  try {
    delete process.env.DATABASE_URL;
    delete process.env.VERCEL;
    process.env.CASE_EMAIL_ENABLED = "true";
    process.env.RESEND_API_KEY = "fake-resend-secret";
    process.env.CASE_EMAIL_FROM = "BRTE <case@example.test>";
    process.env.CASE_TRACKING_URL = "https://brteportal.com.br/tracking";
    process.chdir(dir);
    console.info = (...args) => logs.push(JSON.stringify(args));
    console.error = (...args) => logs.push(JSON.stringify(args));
    globalThis.fetch = async (url, options) => {
      if (String(url) !== "https://api.resend.com/emails") return oldFetch(url, options);
      messages.push({ ...options, input: JSON.parse(options.body) });
      if (failProvider) return new Response("provider failure", { status: 503 });
      return new Response(JSON.stringify({ id: "msg_test_opaque_123" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    };
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const root = "http://127.0.0.1:" + server.address().port;
    const create = async (seed, language) => {
      const response = await oldFetch(root + "/api/cases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleCase(seed, language)),
      });
      return { status: response.status, body: await response.json() };
    };

    const created = await create(1, "es-419");
    assert.equal(created.status, 201);
    assert.equal(created.body.emailNotification, "accepted");
    assert.match(created.body.case.id, /^CAS-[0-9a-f-]+$/);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].input.to[0], "customer-1@example.test");
    assert.match(messages[0].input.subject, /confirmación/);
    assert.ok(messages[0].input.text.includes(created.body.case.id));
    assert.ok(messages[0].input.text.includes(created.body.accessToken));
    assert.equal(messages[0].headers["Idempotency-Key"], "brte-case-confirmation-" + created.body.case.id);
    assert.equal(messages[0].input.html, undefined);
    assert.ok(!messages[0].input.text.includes("fake-resend-secret"));
    const saved = await db.get(created.body.case.id);
    assert.ok(saved.accessHash);
    assert.notEqual(saved.accessHash, created.body.accessToken);
    assert.equal(saved.notificationLanguage, undefined);
    assert.equal(created.body.case.accessHash, undefined);

    failProvider = true;
    const failed = await create(2, "en");
    assert.equal(failed.status, 201);
    assert.equal(failed.body.emailNotification, "failed");
    assert.ok(await db.get(failed.body.case.id), "case must survive rejected e-mail request");
    assert.equal(messages.length, 2);
    const logged = logs.join(" ");
    assert.ok(!logged.includes(created.body.accessToken));
    assert.ok(!logged.includes(failed.body.accessToken));
    assert.ok(!logged.includes("customer-1@example.test"));
    assert.ok(!logged.includes("customer-2@example.test"));
    assert.ok(!logged.includes("fake-resend-secret"));

    process.env.CASE_EMAIL_ENABLED = "false";
    const disabled = await create(3, "zh-CN");
    assert.equal(disabled.status, 201);
    assert.equal(disabled.body.emailNotification, "disabled");
    assert.equal(messages.length, 2);
  } finally {
    globalThis.fetch = oldFetch;
    console.info = oldInfo;
    console.error = oldError;
    if (server) await new Promise(resolve => server.close(resolve));
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("frontend retains protocol/copy even if confirmation is disabled or fails", async () => {
  const form = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");
  const appEnhanced = await readFile(new URL("../server/app-enhanced.mjs", import.meta.url), "utf8");
  const appBase = await readFile(new URL("../server/app.mjs", import.meta.url), "utf8");
  const i18n = await readFile(new URL("../src/portal/portal-i18n.ts", import.meta.url), "utf8");
  assert.match(form, /notificationLanguage:/);
  assert.match(form, /tx\("caseEmailAccepted"\)/);
  assert.match(form, /tx\("caseEmailFailed"\)/);
  assert.match(form, /tx\("caseEmailDisabled"\)/);
  assert.match(form, /result\.accessToken/);
  assert.match(form, /navigator\.clipboard\.writeText/);
  for (const name of ["caseEmailAccepted", "caseEmailFailed", "caseEmailDisabled"]) {
    assert.equal(i18n.split(name + ":").length - 1, 4);
  }
  for (const server of [appEnhanced, appBase]) {
    const save = server.indexOf('await db.put("case"');
    const email = server.indexOf("await notifyCaseCreated(", save);
    assert.ok(email > save, "email must follow database commit");
    assert.match(server, /notificationLanguage, \.\.\.caseData/);
    assert.match(server, /emailNotification/);
  }
});
