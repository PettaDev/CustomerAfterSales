import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("customer wizard heading styles do not leak into standalone /guide", async () => {
  const portal = await read("src/portal/portal.css");
  assert.match(portal, /\.portal \.step-heading \{\s*display: flex;/);
  assert.match(portal, /\.portal \.step-heading small/);
  assert.doesNotMatch(portal, /(?:^|\n)\.step-heading \{\s*display: flex;/);
});

test("guide retains original content and provides a readable vertical step heading", async () => {
  const [page,css,guide] = await Promise.all([
    read("src/pages/GuidePage.tsx"),
    read("src/guide-layout-fix.css"),
    read("src/guides/infinix/mobile.json"),
  ]);
  assert.match(page, /import '\.\.\/guide-layout-fix\.css'/);
  assert.match(css, /\.guide-shell \.step-heading \{\s*display: block;/);
  assert.match(css, /\.guide-shell \.step-heading h1/);
  assert.match(css, /\.guide-shell \.step-heading p/);
  assert.match(css, /\.guide-shell \.guide-layout/);
  assert.match(css, /\.guide-shell \.guide-sidebar/);
  assert.match(css, /\.guide-shell \.instruction-list li/);
  assert.match(css, /\.guide-shell \.persistent-guide-video/);
  assert.match(css, /max-width: 820px/);
  assert.match(css, /max-width: 640px/);
  assert.match(page, /getGuide\(brand\.id, session\.method\)/);
  assert.match(page, /<GuideBlockRenderer/);
  assert.match(page, /<SearchDialog/);
  assert.match(page, /<ImageModal/);
  assert.match(page, /<LogAssistant|<Footer/);
  assert.doesNotMatch(page, /LockKeyhole/);
  for (const id of ["termux-setup","wireless-debugging","split-screen","pair-adb","connect-adb"])
    assert.ok(guide.includes('"id": "' + id + '"'));
});

test("guide keeps assistive reading in both themes and previous-step navigation", async () => {
  const [page,css] = await Promise.all([read("src/pages/GuidePage.tsx"),read("src/guide-layout-fix.css")]);
  assert.match(css, /\.dark \.guide-shell \{/);
  assert.match(css, /\.guide-shell \{\s*--text-soft:/);
  assert.match(css, /scrollbar-width: thin/);
  assert.match(css, /top: 0;/);
  assert.match(page, /setGuideStep\(/);
  assert.match(page, /aria-current=\{current \? 'step'/);
  assert.match(page, /canContinue/);
  assert.match(page, /onClick=\{handleNext\}/);
});
