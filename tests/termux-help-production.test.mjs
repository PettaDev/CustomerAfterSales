import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mobileGuideText, prepareMobileCollectionGuide } from "../src/portal/mobile-collection-guide.ts";

const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("Help Center offers optional Termux guide without changing symptom articles or the footer", async () => {
  const [html, css, js] = await Promise.all([
    read("public/ajuda/index.html"), read("public/brte-help-termux.css"), read("public/brte-help-termux.js"),
  ]);
  assert.match(html, /<section class="brte-termux-help" aria-labelledby="brte-termux-help-title">/);
  assert.match(html, /href="\/guide" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /brte-help-termux\.js/);
  assert.match(html, /brte-help-termux\.css/);
  assert.equal((html.match(/class="brte-termux-help-cta"/g) || []).length, 1);
  assert.match(html, /data-brte-termux="title"/);
  assert.match(html, /id="articles"/);
  assert.match(html, /class="brte-unified-footer"/);
  assert.match(css, /max-width: 430px/);
  assert.match(css, /brte-termux-help-cta:focus-visible/);
  assert.match(css, /data-brte-theme="light"/);
  assert.match(js, /window\.addEventListener\("brte:language"/);
  assert.match(js, /stage: "brand"/);
  assert.match(js, /brandId: null/);
  assert.match(js, /method: null/);
  for (const language of ["pt-BR", "en", "es-419", "zh-CN"])
    assert.ok(js.includes(JSON.stringify(language)), "missing static localization " + language);
});

test("customer mobile path exposes a localized three-step guide while retaining manual evidence upload", async () => {
  const [flow, app, page, css] = await Promise.all([
    read("src/portal/CustomerFlowV2.tsx"), read("src/App.tsx"),
    read("src/pages/GuidePage.tsx"), read("src/portal/portal.css"),
  ]);
  assert.match(flow, /collectionMethod==="mobile"/);
  assert.match(flow, /termuxGuide\.steps\.map/);
  assert.match(flow, /href="\/guide" target="_blank" rel="noopener noreferrer"/);
  assert.match(flow, /prepareMobileCollectionGuide\(form\.brand, language\)/);
  assert.match(flow, /manual-evidence-title/);
  assert.match(app, /const MobileGuide = lazy\(\(\) => import\("\.\/GuideApp"\)\)/);
  assert.match(app, /if \(page === "guide"\) return/);
  assert.match(page, /getGuide\(brand\.id, session\.method\)/);
  assert.match(css, /brte-termux-guide-link:focus-visible/);
  assert.match(css, /max-width: 430px/);
  for (const language of ["pt-BR", "en", "es-419", "zh-CN"]) {
    const t = mobileGuideText(language);
    assert.equal(t.steps.length, 3);
    assert.ok(t.title.length > 8 && t.button.length >= 4);
  }
});

test("new mobile guide shares only safe brand, language and technical navigation state", () => {
  const original = globalThis.window;
  const saved = new Map();
  globalThis.window = { localStorage: { setItem: (key,value) => saved.set(key,value) } };
  try {
    assert.equal(prepareMobileCollectionGuide("tecno", "es-419"), true);
    const stored = JSON.parse(saved.get("transsion-guide-session-v2"));
    assert.deepEqual(stored, {
      language: "es-419", countryCode: "BR", brandId: "tecno",
      method: "mobile", stage: "guide", guideStep: 0, reachedStep: 0, completed: [],
    });
    assert.equal(prepareMobileCollectionGuide("no-brand", "pt-BR"), false);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});

test("Termux help remains independent from supported WebUSB MTK Qualcomm and SPD loggers", async () => {
  const [browser, qualcomm, spd, flow, help] = await Promise.all([
    read("src/portal/BrowserCapture.tsx"), read("src/portal/qualcomm-tranlog.ts"),
    read("src/portal/spd-ylog.ts"), read("src/portal/CustomerFlowV2.tsx"),
    read("public/ajuda/index.html"),
  ]);
  assert.match(browser, /detectQualcommTranLog/);
  assert.match(browser, /detectMediaTekDebugLogger/);
  assert.match(browser, /startSpdYLog/);
  assert.match(qualcomm, /startQualcommTranLog/);
  assert.match(spd, /stopSpdYLog/);
  assert.match(flow, /brte-termux-guide/);
  assert.match(help, /brte-termux-help/);
});
