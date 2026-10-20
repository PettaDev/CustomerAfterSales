import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const flow = readFileSync(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/portal/CollectorDownload.tsx", import.meta.url), "utf8");
const translations = readFileSync(new URL("../src/portal/collector-copy.ts", import.meta.url), "utf8");

test("no-computer choice opens the Collector download route without losing current case state", () => {
  assert.match(flow, /href="\/collector" target="_blank"/);
  assert.match(flow, /setCollectionMethod\("mobile"\)/);
  assert.match(flow, /input type="file" multiple/);
  assert.doesNotMatch(flow, /prepareMobileCollectionGuide|mobileGuideText/);
});

test("Collector is routed separately from the active customer form", () => {
  assert.match(app, /page==="collector"/);
  assert.match(app, /import\("\.\/portal\/CollectorDownload"\)/);
});

test("download remains disabled until a signed release is explicitly enabled", () => {
  assert.match(page, /const APK_RELEASE_READY = false/);
  assert.match(page, /\/downloads\/brte-collector-release\.apk/);
  assert.match(page, /APK_RELEASE_READY \? /);
});

test("Collector guidance is translated and describes upload of the ZIP", () => {
  assert.match(translations, /language\.startsWith\("pt"\)/);
  assert.match(translations, /language\.startsWith\("es"\)/);
  assert.match(translations, /language\.startsWith\("zh"\)/);
  assert.match(translations, /returnNote/);
  assert.match(translations, /ZIP/);
});
