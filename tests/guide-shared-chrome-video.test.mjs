import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getChipsetVideo } from "../src/guides/chipset-videos.ts";
const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("guide uses exactly one shared BRTE navbar and footer from App, not a second guide chrome", async () => {
  const [app, guide] = await Promise.all([read("src/App.tsx"), read("src/ChipsetGuideApp.tsx")]);
  assert.equal((app.match(/className="brte-unified-footer"/g) || []).length, 1);
  assert.equal((app.match(/className="brte-site-header"/g) || []).length, 1);
  assert.match(app, /portal-with-guide/);
  assert.ok(app.includes('page === "guide" ? <Suspense fallback={fallback}><MobileGuide /></Suspense> : <main>'));
  assert.ok(app.includes("location.pathname.replace("));
  assert.doesNotMatch(guide, /className="chipset-header"|className="chipset-footer"/);
  assert.match(guide, /const \{ i18n \} = useTranslation\(\)/);
  assert.doesNotMatch(guide, /toggleDarkMode|setLanguage\(/);
  assert.equal(app.split('href="/dashboard"').length - 1, 1);
});

test("guide inherits portal theme, readable controls and full-height footer alignment on desktop and mobile", async () => {
  const css = await read("src/chipset-guide.css");
  assert.match(css, /\.portal\.portal-with-guide \{/);
  assert.match(css, /display: flex;\s*flex-direction: column;\s*min-height: 100dvh/);
  assert.match(css, /\.portal\.portal-with-guide\[data-theme="dark"\] > \.brte-chipset-guide/);
  assert.match(css, /\.portal\.portal-with-guide > \.brte-unified-footer/);
  assert.match(css, /\.portal\.portal-with-guide \.brte-chipset-guide \.chipset-card/);
  assert.match(css, /\.portal\.portal-with-guide \.brte-chipset-guide \.chipset-navigation \.chipset-next/);
  assert.match(css, /max-width: 850px/);
  assert.match(css, /max-width: 650px/);
});

test("video system is ready per chipset/step but does not load nonexistent files", async () => {
  for (const chipset of ["mediatek", "qualcomm", "unisoc"]) {
    for (const step of [0, 2, 6, 7, 8, 9]) assert.equal(getChipsetVideo(chipset, step), undefined);
  }
  const [app,manifest] = await Promise.all([read("src/ChipsetGuideApp.tsx"),read("src/guides/chipset-videos.ts")]);
  assert.match(app, /getChipsetVideo\(chipset, step\)/);
  assert.match(app, /video && <section className="chipset-process-video"/);
  assert.match(app, /<video src=\{video\.src\} controls playsInline preload="metadata"/);
  assert.match(manifest, /public\/videos\/brte/);
  assert.match(manifest, /mediatek:/); // typed media configuration for all three
  assert.match(manifest, /qualcomm:/);
  assert.match(manifest, /unisoc:/);
});
