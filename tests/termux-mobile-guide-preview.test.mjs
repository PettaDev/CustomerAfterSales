import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mobileGuideText, prepareMobileCollectionGuide } from "../src/portal/mobile-collection-guide.ts";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("mobile collection button and Termux guide are discoverable, optional and localized", async () => {
  const [form, app, css] = await Promise.all([
    read("src/portal/CustomerFlowV2.tsx"),
    read("src/App.tsx"),
    read("src/portal/portal.css"),
  ]);
  assert.match(form, /collectionMethod==="mobile"/);
  assert.match(form, /termuxGuide\.steps\.map/);
  assert.match(form, /termuxGuide\.button/);
  assert.match(form, /href="\/guide" target="_blank" rel="noopener noreferrer"/);
  assert.match(form, /prepareMobileCollectionGuide\(form\.brand, language\)/);
  assert.match(form, /copy\.noComputerGuide|termuxGuide\.note/);
  assert.match(form, /manual-evidence-title/);
  assert.match(form, /TrackedBrowserCapture/);
  assert.match(app, /const MobileGuide = lazy\(\(\) => import\("\.\/GuideApp"\)\)/);
  assert.match(app, /if \(page === "guide"\) return/);
  assert.match(css, /brte-termux-guide-link:focus-visible/);
  assert.match(css, /@media \(max-width: 430px\)/);
  for (const language of ["pt-BR", "en", "es-419", "zh-CN"]) {
    const text = mobileGuideText(language);
    assert.equal(text.steps.length, 3);
    assert.ok(text.title.length > 10);
    // Short Chinese labels are valid; verify a meaningful translated action.
    assert.ok(text.button.length >= 4);
    assert.ok(text.note.length > 15);
  }
});

test("guide opens at the selected brand/language without copying personal data", () => {
  const original = globalThis.window;
  const entries = new Map();
  globalThis.window = { localStorage: {
    setItem: (key, value) => entries.set(key, value),
  }};
  try {
    assert.equal(prepareMobileCollectionGuide("itel", "pt-BR"), true);
    const data = JSON.parse(entries.get("transsion-guide-session-v2"));
    assert.deepEqual(data, {
      language: "pt-BR", countryCode: "BR", brandId: "itel",
      method: "mobile", stage: "guide", guideStep: 0, reachedStep: 0, completed: [],
    });
    assert.equal(prepareMobileCollectionGuide("tecno", "es-419"), true);
    assert.equal(JSON.parse(entries.get("transsion-guide-session-v2")).brandId, "tecno");
    assert.equal(prepareMobileCollectionGuide("infinix", "zh-CN"), true);
    assert.equal(JSON.parse(entries.get("transsion-guide-session-v2")).language, "zh-CN");
    assert.equal(prepareMobileCollectionGuide("unknown", "pt-BR"), false);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});

test("original guide library still contains Termux and wireless debugging, without replacing WebUSB automation", async () => {
  const [guide, page, browser, spd, qcom] = await Promise.all([
    read("src/guides/infinix/mobile.json"),
    read("src/pages/GuidePage.tsx"),
    read("src/portal/BrowserCapture.tsx"),
    read("src/portal/spd-ylog.ts"),
    read("src/portal/qualcomm-tranlog.ts"),
  ]);
  for (const step of ["termux-setup", "wireless-debugging", "pair-adb", "connect-adb"])
    assert.ok(guide.includes(step), "missing original step " + step);
  assert.match(page, /getGuide\(brand\.id, session\.method\)/);
  assert.match(browser, /startSpdYLog/);
  assert.match(spd, /startSpdYLog/);
  assert.match(qcom, /startQualcommTranLog/);
});
