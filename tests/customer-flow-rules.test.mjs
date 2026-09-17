import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";

const baseCase = {
  brand: "infinix",
  model: "X6873",
  build: "TEST-BUILD",
  category: "software",
  problem: "Wi-Fi disconnects unexpectedly",
  description: "x",
  expected: "Wi-Fi should remain connected",
  carrier: "Not applicable",
  name: "Test User",
  email: "test@example.com",
  phone: "+55 11 99999-9999",
  consent: true,
};

test("customer flow rules: notes have no minimum, software contact is minimal and hardware requires address", async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(tmpdir() + "/aftercare-flow-");
  process.chdir(dir);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;

  const createCase = (body) => fetch(base + "/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  try {
    const software = await createCase(baseCase);
    assert.equal(software.status, 201);
    const softwareBody = await software.json();
    assert.equal(softwareBody.case.description, "x");
    assert.equal(softwareBody.case.country, "");
    assert.equal(softwareBody.case.street, "");

    const emptyNotes = await createCase({ ...baseCase, email: "empty@example.com", description: "" });
    assert.equal(emptyNotes.status, 201);

    const hardwareMissingAddress = await createCase({
      ...baseCase,
      category: "hardware",
      email: "hardware-missing@example.com",
    });
    assert.equal(hardwareMissingAddress.status, 400);

    const hardwareComplete = await createCase({
      ...baseCase,
      category: "hardware",
      email: "hardware@example.com",
      country: "Brasil",
      postalCode: "01001-000",
      street: "Praça da Sé",
      addressNumber: "1",
      addressComplement: "",
      neighborhood: "Sé",
      city: "São Paulo",
      state: "SP",
    });
    assert.equal(hardwareComplete.status, 201);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("software flow keeps both collection methods and copy for all supported portal languages", async () => {
  const source = await readFile(new URL("../src/portal/CustomerFlow.tsx", import.meta.url), "utf8");
  for (const marker of [
    "SEM COMPUTADOR",
    "SIN COMPUTADORA",
    "无需电脑",
    "NO COMPUTER",
    "COMPUTADOR / NAVEGADOR",
    "COMPUTADORA / NAVEGADOR",
    "电脑 / 浏览器",
    "COMPUTER / BROWSER",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.match(source, /collectionMethod===\"mobile\"/);
  assert.match(source, /collectionMethod===\"browser\"/);
  assert.match(source, /no minimum character requirement/);
});

test("hardware Step 3 is manual visual evidence only and includes triage guidance in all languages", async () => {
  const source = await readFile(new URL("../src/portal/CustomerFlow.tsx", import.meta.url), "utf8");

  assert.match(source, /step===2&&hardware/);
  assert.match(source, /step===2&&!hardware/);
  assert.match(source, /accept=\"image\/\*,video\/\*\"/);
  assert.match(source, /hardwareFileTypeError/);
  assert.match(source, /hardwareEvidenceRequired/);
  assert.match(source, /selectCollectionMethod\(\"browser\"\)/);

  for (const marker of [
    "Envie fotos ou um vídeo do problema",
    "Envía fotos o un video del problema",
    "请上传问题照片或视频",
    "Upload photos or a video of the issue",
    "WhatsApp",
    "IMEI",
    "bateria estufada",
    "batería está hinchada",
    "电池鼓包",
    "battery is swollen",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
