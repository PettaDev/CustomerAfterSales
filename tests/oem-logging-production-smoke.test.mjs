import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("production OEM automation includes SPD/Qualcomm and retains MTK generic fallback", async () => {
  const [webusb,spd,qualcomm,mtk] = await Promise.all([
    read("src/portal/BrowserCapture.tsx"),read("src/portal/spd-ylog.ts"),
    read("src/portal/qualcomm-tranlog.ts"),read("src/portal/mediatek-debuglogger.ts")
  ]);
  assert.match(webusb,/detectSpdYLog\(adb, shell\)/);
  assert.match(webusb,/startSpdYLog\(adb, shell\)/);
  assert.match(webusb,/stopSpdYLog\(adb, shell\)/);
  assert.match(webusb,/pullSpdYLog\(adb, shell, readRemoteFile/);
  assert.match(webusb,/detectMediaTekDebugLogger/);
  assert.match(webusb,/detectQualcommTranLog/);
  assert.match(webusb,/ADB Logcat \(genérico\)/);
  assert.match(spd,/MAX_TOTAL_BYTES = 256 \* 1024 \* 1024/);
  assert.match(qualcomm,/await sleep\(8000\)/);
  assert.match(mtk,/MTK_TARGET = 39/);
});

test("Collector-first Help Center, advanced guide, staff and case API remain independently wired", async () => {
  const [app,help,flow,email,api,guide] = await Promise.all([
    read("src/App.tsx"),read("public/ajuda/index.html"),
    read("src/portal/CustomerFlowV2.tsx"),read("server/case-email.mjs"),
    read("server/app-enhanced.mjs"),read("src/portal/mobile-collection-guide.ts"),
  ]);
  assert.ok(app.includes('page === "guide" ? <Suspense fallback={fallback}><MobileGuide /></Suspense> : <main>'));
  assert.match(app,/className="brte-unified-footer"/);
  assert.match(help,/brte-collector-help/);
  assert.match(help,/class="brte-collector-help-cta" href="\/collector"/);
  assert.match(help,/<details class="brte-collector-help-advanced">/);
  assert.match(help,/href="\/guide"/);
  assert.match(flow,/brte-termux-guide/);
  assert.match(flow,/caseEmailAccepted/);
  assert.match(guide,/prepareMobileCollectionGuide/);
  assert.match(api,/notifyCaseCreated/);
  assert.match(email,/CASE_EMAIL_ENABLED/);
});
