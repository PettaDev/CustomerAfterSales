import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chipsetGuideCopy, chipsetGuideSteps } from "../src/guides/chipset-mobile.ts";
const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("mobile guide offers only MediaTek, Qualcomm and SPD/Unisoc, never filters by brand or PC", async () => {
  const [app, page, oldData] = await Promise.all([
    read("src/GuideApp.tsx"), read("src/ChipsetGuideApp.tsx"), read("src/guides/infinix/mobile.json"),
  ]);
  assert.match(app, /<ChipsetGuideApp \/>/);
  assert.doesNotMatch(app, /BrandPage|LanguagePage|MethodPage|WizardProgress/);
  assert.match(page, /PLATFORMS: Chipset\[\] = \["mediatek", "qualcomm", "unisoc"\]/);
  assert.match(page, /chipsetGuideSteps\(language, chipset\)/);
  assert.doesNotMatch(page, /getGuide\(|BrandPage|MethodPage/);
  assert.match(page, /unknownInfo/);
  assert.match(page, /type="button"/);
  assert.ok(oldData.includes("termux-setup"), "keep original sources untouched");
});

test("platform-specific logger instructions cannot silently show MediaTek steps on Qualcomm or SPD", () => {
  const mtk = chipsetGuideSteps("pt-BR", "mediatek");
  const qualcomm = chipsetGuideSteps("pt-BR", "qualcomm");
  const spd = chipsetGuideSteps("pt-BR", "unisoc");
  assert.equal(mtk.length, 10);
  assert.equal(qualcomm.length, 10);
  assert.equal(spd.length, 10);
  assert.match(mtk[6].items.join(" "), /DebugLoggerUI/);
  assert.match(qualcomm[6].items.join(" "), /TranLogManager/);
  assert.match(spd[6].items.join(" "), /YLog/);
  assert.match(qualcomm[6].code, /com\.transsion\.TranLogManager\/\.TranLogManageActivity/);
  assert.match(spd[6].code, /com\.sprd\.logmanager\/\.logui\.LogMainActivity/);
  assert.doesNotMatch(spd[6].items.join(" "), /DebugLoggerUI|TranLogManager/);
  assert.doesNotMatch(qualcomm[6].items.join(" "), /DebugLoggerUI|YLog/);
  assert.equal(mtk[6].code, undefined);
  assert.match(spd[8].code, /\/data\/ylog/);
  assert.match(qualcomm[8].code, /\/data\/debuglogger/);
  assert.match(mtk[8].code, /\/data\/debuglogger/);
});

test("guide avoids unsafe destructive operations and offers protected-directory fallback", async () => {
  const script = await read("src/guides/chipset-mobile.ts");
  for (const lang of ["pt-BR", "en", "es-419", "zh-CN"]) {
    const c = chipsetGuideCopy(lang);
    assert.ok(c.app && c.choose && c.fallback && c.unknown && c.warning);
    for (const p of ["mediatek", "qualcomm", "unisoc"]) {
      const steps = chipsetGuideSteps(lang, p);
      assert.match(steps[2].code, /termux-setup-storage/);
      assert.match(steps[4].code, /adb pair/);
      assert.match(steps[5].code, /adb connect/);
      assert.match(steps[8].items.join(" "), /\/data\//);
    }
  }
  assert.doesNotMatch(script, /"adb shell rm|adb root|fastboot|format --|rm -rf| -delete"/i);
  const page = await read("src/ChipsetGuideApp.tsx");
  assert.match(page, /adb logcat -d/);
  assert.match(page, /setChipset\(null\)/);
  assert.match(page, /BRTE-logcat\.txt/);
  assert.doesNotMatch(page, /termux-adb-process\.mp4/);
});

test("privacy notice has a complete readable card, not an unfinished background", async () => {
  const [css, flow] = await Promise.all([
    read("src/portal/portal.css"), read("src/portal/CustomerFlowV2.tsx"),
  ]);
  assert.match(flow, /className="privacy-note brte-privacy-card"/);
  assert.match(css, /\.portal \.customer-layout > \.journey \.privacy-note\.brte-privacy-card \{/);
  assert.match(css, /border: 1px solid #44647a/);
  assert.match(css, /background: #162a3e/);
  assert.match(css, /privacy-note\.brte-privacy-card > p/);
  assert.match(css, /\[data-theme="light"\].*privacy-note\.brte-privacy-card/);
});

test("chipset page supports responsive phone layout and guides only, not cases or auth", async () => {
  const [css,app] = await Promise.all([
    read("src/chipset-guide.css"), read("src/ChipsetGuideApp.tsx"),
  ]);
  assert.match(css, /max-width: 650px/);
  assert.match(css, /max-width: 850px/);
  assert.match(css, /\.brte-chipset-guide/);
  assert.match(app, /role="progressbar"/);
  assert.match(app, /aria-current=\{step===index\?"step":undefined\}/);
  assert.match(app, /const \{ i18n \} = useTranslation\(\)/);\n  assert.doesNotMatch(app, /className="chipset-header"|className="chipset-footer"/);
  assert.doesNotMatch(app, /\/api\/|auth\/request-code|localStorage\.setItem/);
});
