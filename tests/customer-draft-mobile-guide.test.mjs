import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CUSTOMER_DRAFT_KEY, CUSTOMER_DRAFT_TTL_MS,
  readCustomerDraft, saveCustomerDraft, clearCustomerDraft,
} from "../src/portal/customer-draft.ts";

function mockStorage() {
  const content = new Map();
  return {
    content,
    getItem: (key) => content.get(key) ?? null,
    setItem: (key, value) => { content.set(key, value); },
    removeItem: (key) => { content.delete(key); },
  };
}

test("customer intake draft resumes stage, text and mobile method without persisting IMEI or consent", () => {
  const store = mockStorage();
  const input = {
    step: 2, collectionMethod: "mobile", hardwareSafety: null, hadFiles: true,
    form: { brand: "infinix", model: "X6891", description: "Wi-Fi disconnects", name: "Example",
      email: "sample@example.com", deviceIdentifier: "NOT-PERSISTED", consent: true,
      accessToken: "NOT-PERSISTED" },
  };
  assert.equal(saveCustomerDraft(input, store, 1000), true);
  const raw = store.getItem(CUSTOMER_DRAFT_KEY);
  assert.doesNotMatch(raw, /NOT-PERSISTED/);
  assert.doesNotMatch(raw, /consent/);
  const restored = readCustomerDraft(store, 2000);
  assert.equal(restored.step, 2);
  assert.equal(restored.collectionMethod, "mobile");
  assert.equal(restored.form.model, "X6891");
  assert.equal(restored.hadFiles, true);
  assert.equal(restored.form.consent, undefined);
  clearCustomerDraft(store);
  assert.equal(readCustomerDraft(store, 2000), null);
});

test("expired or tampered customer drafts cannot be restored; initial blank form is not kept", () => {
  const store = mockStorage();
  saveCustomerDraft({ step: 3, collectionMethod: null, hardwareSafety: "safe", hadFiles: false, form: { model: "X6886" } }, store, 1000);
  assert.equal(readCustomerDraft(store, 1000 + CUSTOMER_DRAFT_TTL_MS + 1), null);
  assert.equal(store.getItem(CUSTOMER_DRAFT_KEY), null);
  store.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify({ version: 1, savedAt: 1000, step: 6, form: {} }));
  assert.equal(readCustomerDraft(store, 1001), null);
  saveCustomerDraft({ step: 0, collectionMethod: null, hardwareSafety: null, hadFiles: false, form: { model: "", consent: false } }, store, 2000);
  assert.equal(store.getItem(CUSTOMER_DRAFT_KEY), null);
});

test("client flow restores original Termux Wi-Fi guide route and saves only pre-submission drafts", async () => {
  const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
  const [app, flow, guide, css, legacy, main] = await Promise.all([
    read("src/App.tsx"), read("src/portal/CustomerFlowV2.tsx"),
    read("src/portal/mobile-collection-guide.ts"), read("src/portal/portal.css"),
    read("src/pages/GuidePage.tsx"), read("src/guides/infinix/mobile.json"),
  ]);
  assert.match(app, /lazy\(\(\) => import\("\.\/GuideApp"\)\)/);
  assert.match(app, /if \(page === "guide"\) return/);
  assert.match(flow, /readCustomerDraft\(\)/);
  assert.match(flow, /saveCustomerDraft\(/);
  assert.match(flow, /clearCustomerDraft\(\)/);
  assert.match(flow, /if \(step === 4 \|\| result\)/);
  assert.match(flow, /href="\/guide" target="_blank" rel="noopener noreferrer"/);
  assert.match(flow, /prepareMobileCollectionGuide\(form\.brand, language\)/);
  assert.match(flow, /draftRestored &&/);
  assert.match(css, /\.brte-draft-recovered/);
  assert.match(css, /max-width: 430px/);
  assert.match(guide, /"transsion-guide-session-v2"/);
  for (const code of ['pt-BR', 'en', 'es-419', 'zh-CN']) assert.ok(guide.includes(code));
  assert.match(legacy, /getGuide\(brand\.id, session\.method\)/);
  for (const step of ["termux-setup", "wireless-debugging", "pair-adb", "connect-adb"]) {
    assert.ok(main.includes(step), "missing original technical guide step: " + step);
  }
});
