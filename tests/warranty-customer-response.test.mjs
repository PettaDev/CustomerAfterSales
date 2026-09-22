import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";

test("hardware warranty triage is optional, persisted, and customer replies require case access", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/aftercare-warranty-");
  process.chdir(dir);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  try {
    const created = await fetch(base + "/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "infinix",
        model: "X6873",
        build: "",
        category: "hardware",
        problem: "Device does not charge",
        description: "",
        expected: "",
        carrier: "",
        name: "Test User",
        email: "warranty@example.com",
        phone: "+55 11 99999-9999",
        country: "Brasil",
        postalCode: "01001-000",
        street: "Praça da Sé",
        addressNumber: "1",
        addressComplement: "",
        neighborhood: "Sé",
        city: "São Paulo",
        state: "SP",
        warrantyStatus: "yes",
        deviceIdentifier: "IMEI-TEST-123",
        purchaseDate: "2026-02-10",
        consent: true,
      }),
    });
    assert.equal(created.status, 201);
    const body = await created.json();
    assert.equal(body.case.warrantyStatus, "yes");
    assert.equal(body.case.deviceIdentifier, "IMEI-TEST-123");
    assert.equal(body.case.purchaseDate, "2026-02-10");

    const reply = await fetch(base + "/api/cases/" + body.case.id + "/customer-replies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + body.accessToken,
      },
      body: JSON.stringify({ message: "I completed the requested validation." }),
    });
    assert.equal(reply.status, 201);

    const denied = await fetch(base + "/api/cases/" + body.case.id + "/customer-replies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-token",
      },
      body: JSON.stringify({ message: "This must not be accepted." }),
    });
    assert.equal(denied.status, 403);

    const detail = await fetch(base + "/api/cases/" + body.case.id, {
      headers: { Authorization: "Bearer " + body.accessToken },
    });
    assert.equal(detail.status, 200);
    const detailBody = await detail.json();
    const customerEvent = detailBody.events.find((event) => event.source === "customer");
    assert.equal(customerEvent.note, "I completed the requested validation.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("warranty and customer reply UX is localized in all supported portal languages", async () => {
  const portal = await readFile(new URL("../src/portal/portal-i18n.ts", import.meta.url), "utf8");
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const hardware = await readFile(new URL("../src/portal/HardwareCollection.tsx", import.meta.url), "utf8");
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");

  for (const marker of [
    "Possível garantia",
    "Possible warranty",
    "Posible garantía",
    "可能的保修",
    "Responder ao suporte",
    "Reply to support",
    "Responder a soporte",
    "回复支持团队",
  ]) assert.ok((portal + ui).includes(marker), "missing localized copy: " + marker);

  assert.match(hardware, /comprovante de compra/);
  assert.match(hardware, /proof of purchase/);
  assert.match(cases, /customer-replies/);
  assert.match(cases, /e\.source === "customer"/);
  assert.match(cases, /c\.warrantyStatus/);
});
