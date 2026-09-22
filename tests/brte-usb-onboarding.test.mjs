import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("BRTE browser collection teaches Developer Mode and USB debugging in all four portal languages", async () => {
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const capture = await readFile(new URL("../src/portal/BrowserCapture.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/browser-capture.css", import.meta.url), "utf8");

  for (const marker of [
    "Como ativar o Modo Desenvolvedor e a Depuração USB",
    "How to enable Developer Mode and USB debugging",
    "Cómo activar el Modo desarrollador y la Depuración USB",
    "如何开启开发者模式和 USB 调试",
    "Permitir depuração USB? / Allow USB debugging?",
    "Allow USB debugging?",
    "¿Permitir depuración USB? / Allow USB debugging?",
    "允许 USB 调试？/ Allow USB debugging?",
    "O vídeo não tem áudio.",
    "The video has no audio.",
    "El video no tiene audio.",
    "视频没有声音",
  ]) {
    assert.ok(ui.includes(marker), "missing localized USB onboarding copy: " + marker);
  }

  for (const key of [
    "developerSetupTitle",
    "developerGuideTitle",
    "developerStep1",
    "developerStep2",
    "developerStep3",
    "developerStep4",
    "developerStep5",
    "developerStep6",
    "developerMenuNote",
    "developerAfterUse",
    "tutorialBadge",
    "tutorialTitle",
    "tutorialText",
    "tutorialLoading",
    "tutorialUnavailable",
    "tutorialNoAudio",
    "tutorialPrivacy",
  ]) {
    const count = ui.split(key + ":").length - 1;
    assert.equal(count, 4, key + " must exist exactly once in each supported language");
  }

  assert.match(capture, /UsbSetupTutorial/);
  assert.match(capture, /\/tutorials\/brte-usb\/0\$\{part\}\.b64/);
  assert.match(capture, /preload="metadata"/);
  assert.match(capture, /playsInline/);
  assert.match(capture, /usb-onboarding-grid/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.35fr\)minmax\(210px,\.65fr\)/);
  assert.match(css, /@media\(max-width:720px\).*usb-onboarding-grid\{grid-template-columns:1fr\}/s);
});

test("sanitized BRTE tutorial asset reconstructs as an MP4", async () => {
  const parts = await Promise.all(
    [0, 1, 2, 3].map((part) =>
      readFile(
        new URL("../public/tutorials/brte-usb/0" + part + ".b64", import.meta.url),
        "utf8",
      ),
    ),
  );
  const bytes = Buffer.from(parts.join("").replace(/\s+/g, ""), "base64");
  assert.ok(bytes.length > 10_000, "tutorial asset is unexpectedly small");
  assert.ok(bytes.length < 100_000, "tutorial asset should stay lightweight");
  assert.equal(bytes.subarray(4, 8).toString("ascii"), "ftyp");
  assert.ok(bytes.includes(Buffer.from("moov")), "MP4 is missing moov metadata");
  assert.ok(bytes.includes(Buffer.from("mdat")), "MP4 is missing media data");
});

test("active customer and team surfaces use the BRTE product name", async () => {
  const paths = [
    "../src/App.tsx",
    "../src/portal/CustomerFlowV2.tsx",
    "../src/portal/BrowserCapture.tsx",
    "../src/portal/portal-ui-i18n.ts",
    "../server/email.mjs",
    "../index.html",
  ];
  const sources = await Promise.all(
    paths.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );
  const joined = sources.join("\n");

  assert.doesNotMatch(joined, /Aftercare/i);
  assert.match(joined, /BRTE/);
  assert.match(sources[0], /BR<span>TE<\/span>/);
  assert.match(sources[1], /BRTE · TRANSSION/);
  assert.match(sources[2], /BRTE Support/);
  assert.match(sources[2], /brte-\$\{stamp\}/);
  assert.match(sources[4], /BRTE access code/);
  assert.match(sources[5], /<title>BRTE · Customer After-Sales<\/title>/);
});
