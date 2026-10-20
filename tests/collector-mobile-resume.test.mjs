import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clearMobileCollectorDraft,
  readMobileCollectorDraft,
  saveMobileCollectorDraft,
} from "../src/portal/mobile-collector-draft.ts";

const source = p => readFile(new URL("../" + p, import.meta.url), "utf8");

function withMockStorage(callback) {
  const previous = globalThis.sessionStorage;
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  try { callback(values); } finally {
    if (previous === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previous;
  }
}

test("session-only Collector draft restores text but never file contents or access tokens", () => {
  withMockStorage(store => {
    const original = {
      brand: "infinix", category: "software", model: "GT 30", problem: "Wi-Fi issue",
      expected: "Keep connection", email: "sample@example.test", phone: "11999999999",
      accessToken: "PRIVATE-TOKEN", files: [{ name: "private.zip", content: "VERY-PRIVATE" }],
      consent: true, deviceIdentifier: "CONFIDENTIAL-IMEI",
    };
    saveMobileCollectorDraft(2, original);
    const saved = [...store.values()].join("");
    assert.doesNotMatch(saved, /PRIVATE-TOKEN|VERY-PRIVATE|CONFIDENTIAL-IMEI|private.zip/);
    assert.doesNotMatch(saved, /"consent"/);
    const restored = readMobileCollectorDraft();
    assert.equal(restored.step, 2);
    assert.equal(restored.form.problem, "Wi-Fi issue");
    assert.equal(restored.form.email, "sample@example.test");
    assert.equal(restored.form.accessToken, undefined);
    clearMobileCollectorDraft();
    assert.equal(readMobileCollectorDraft(), null);
  });
});

test("draft refuses invalid, expired and non-mobile content", () => {
  withMockStorage(store => {
    saveMobileCollectorDraft(1, { category: "software" });
    assert.equal(store.size, 0);
    saveMobileCollectorDraft(3, { category: "software", problem: "A" });
    const key = [...store.keys()][0];
    const payload = JSON.parse(store.get(key));
    store.set(key, JSON.stringify({ ...payload, savedAt: Date.now() - 5 * 60 * 60 * 1000 }));
    assert.equal(readMobileCollectorDraft(), null);
    store.set(key, JSON.stringify({ ...payload, method: "browser" }));
    assert.equal(readMobileCollectorDraft(), null);
    store.set(key, JSON.stringify({ ...payload, form: { category: "hardware" } }));
    assert.equal(readMobileCollectorDraft(), null);
    store.set(key, "not JSON");
    assert.equal(readMobileCollectorDraft(), null);
  });
});

test("no-computer flow restores fields without restoring consent or selected files", async () => {
  const flow = await source("src/portal/CustomerFlowV2.tsx");
  assert.match(flow, /readMobileCollectorDraft<FlowForm>/);
  assert.match(flow, /restoredDraft \? \{ \.\.\.defaults, \.\.\.restoredDraft\.form, consent: false \}/);
  assert.match(flow, /saveMobileCollectorDraft\(2, form\)/);
  assert.match(flow, /clearMobileCollectorDraft\(\)/);
  assert.match(flow, /collectorGuide\.restoreNote/);
  assert.match(flow, /href="\/collector" target="_blank" rel="noopener noreferrer"/);
  assert.match(flow, /input type="file" multiple accept="[^"]*\.zip/);
  assert.match(flow, /const EVIDENCE_MAX_FILES = 15/);
  assert.match(flow, /3 \* 1024 \*\* 3/);
  assert.match(flow, /1024 \*\* 3/);
  assert.match(flow, /<TrackedBrowserCapture /);
});

test("Collector has comprehensive localized guidance, no phantom APK or videos", async () => {
  const [page, copy, css] = await Promise.all([
    source("src/portal/CollectorDownload.tsx"),
    source("src/portal/collector-copy.ts"),
    source("src/portal/collector-download.css"),
  ]);
  assert.match(page, /const APK_RELEASE_READY = false/);
  assert.match(page, /\/downloads\/brte-collector-release\.apk/);
  for (const key of ["requirements", "permissions", "guides", "videoNote", "privacyText", "footerHint", "restoreNote"]) {
    assert.equal((copy.match(new RegExp(key + ":", "g")) || []).length, 4, key);
  }
  assert.match(page, /copy\.guides\.map/);
  assert.match(page, /copy\.permissions\.map/);
  assert.match(page, /!APK_RELEASE_READY &&/);
  assert.doesNotMatch(page, /<video /);
  assert.match(css, /max-width: 420px/);
  assert.match(css, /max-width: 700px/);
  assert.match(css, /data-theme="light"/);
});
