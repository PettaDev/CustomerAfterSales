import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("browser capture uses customer-friendly preparation and 1 GB limit", async () => {
  const capture = await readFile(new URL("../src/portal/BrowserCapture.tsx", import.meta.url), "utf8");
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");

  assert.match(capture, /MAX_VIDEO_BYTES = 1024 \* 1024 \* 1024/);
  assert.match(capture, /beforeConnectTitle/);
  assert.match(capture, /beforeConnectCable/);
  assert.match(capture, /beforeConnectUnlock/);
  assert.match(capture, /beforeConnectPermission/);
  assert.doesNotMatch(capture, /Feche ADB, Android Studio, scrcpy/);
  assert.doesNotMatch(capture, /Close ADB, Android Studio, scrcpy/);

  for (const marker of [
    "Antes de conectar",
    "Before connecting",
    "Antes de conectar",
    "连接之前",
    "Tentar conexão novamente",
    "Try connection again",
    "Intentar la conexión nuevamente",
    "重新尝试连接",
  ]) assert.ok(ui.includes(marker), "missing browser UX copy: " + marker);
});

test("uploads expose real progress and keep technical details out of customer error", async () => {
  const api = await readFile(new URL("../src/portal/api.ts", import.meta.url), "utf8");
  const flow = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");

  assert.match(api, /XMLHttpRequest/);
  assert.match(api, /request\.upload\.onprogress/);
  assert.match(api, /class UploadError/);
  assert.doesNotMatch(api, /O envio de .* falhou/);
  assert.match(flow, /caseCreatedUploading/);
  assert.match(flow, /keepPageOpen/);
  assert.match(flow, /uploadProgress/);
  assert.match(flow, /DUPLICATE_EVIDENCE/);
  assert.match(flow, /EVIDENCE_QUOTA/);
  assert.match(flow, /CASE_RATE_LIMIT/);
  assert.match(flow, /caseCreated \? tx\("uploadFailed"\) : copy\.sendError/);
});

test("customer tracking hides internal ownership and adapts evidence by category", async () => {
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");

  assert.match(cases, /staff && <div><dt>\{ui\.owner\}/);
  assert.match(cases, /c\.category === "hardware"/);
  assert.match(cases, /"\.png,\.jpg,\.jpeg,\.mp4"/);
  assert.match(cases, /c\.category === "software" && <section className="panel">/);
  assert.doesNotMatch(cases, /staff \|\| c\.category === "software"/);
  assert.match(cases, /ui\.nextStepTitle/);
  assert.match(cases, /ui\.uploadingFile/);
});

test("internal TFAE entry is hidden from public navigation and new copy is localized", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const portal = await readFile(new URL("../src/portal/portal-i18n.ts", import.meta.url), "utf8");

  assert.equal(app.split('href="/dashboard"').length - 1, 1);
  assert.ok(app.includes('tx("teamAccess")'));
  assert.equal(app.includes('tx("tfae")'), false);
  assert.match(app, /aria-label=\{tx\("mainNavigation"\)\}/);
  assert.doesNotMatch(app, /Customer After-Sales · TFAE/);

  for (const marker of [
    "Mantenha esta página aberta até o envio terminar.",
    "Keep this page open until the upload finishes.",
    "Mantén esta página abierta hasta que termine el envío.",
    "请保持此页面打开，直到上传完成。",
  ]) assert.ok(portal.includes(marker), "missing upload copy: " + marker);
});
