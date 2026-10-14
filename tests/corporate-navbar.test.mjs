import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load = (name) => readFile(new URL("../" + name, import.meta.url), "utf8");
const guidePaths = [
  "public/ajuda/index.html",
  "public/ajuda/wifi-desconecta/index.html",
  "public/ajuda/aplicativo-fecha/index.html",
  "public/ajuda/rede-movel-sms/index.html",
  "public/ajuda/aquecimento-bateria/index.html",
  "public/ajuda/atualizacao-sistema/index.html",
];

test("premium site header is keyboard accessible, responsive and keeps team access in footer", async () => {
  const [app, style, index] = await Promise.all([
    load("src/App.tsx"), load("public/brte-site.css"), load("index.html"),
  ]);
  assert.match(app, /className="brte-site-header"/);
  assert.match(app, /className="brte-header-cta"/);
  assert.match(app, /aria-label=\{menuOpen\?nav\.closeMenu:nav\.openMenu\}/);
  assert.match(app, /aria-expanded=\{menuOpen\}/);
  assert.match(app, /aria-controls="brte-primary-nav"/);
  assert.match(app, /setMenuOpen\(current=>!current\)/);
  assert.match(app, /setPortalLanguage\(event\.target\.value\)/);
  assert.match(app, /initialTheme/);
  assert.match(app, /brte-theme/);
  assert.match(index, /href="\/brte-site\.css"/);
  assert.match(style, /position: sticky/);
  assert.match(style, /:focus-visible/);
  assert.match(style, /max-width: 850px/);
  assert.match(style, /\.brte-nav\.is-open/);
  assert.equal(app.split('href="/dashboard"').length - 1, 1, "team entry only in footer");
});

test("help pages reuse branded navbar, language and saved theme without losing crawlable content", async () => {
  const [behavior, css] = await Promise.all([load("public/brte-site.js"),load("public/brte-site.css")]);
  assert.match(behavior, /aftercare-language/);
  assert.match(behavior, /brte-theme/);
  assert.match(behavior, /aria-expanded/);
  assert.match(css, /data-theme="light"/);
  for (const name of guidePaths) {
    const html = await load(name);
    assert.match(html, /class="brte-site-header"/);
    assert.match(html, /href="\/brte-site\.css"/);
    assert.match(html, /src="\/brte-site\.js"/);
    assert.match(html, /aria-controls="brte-primary-nav"/);
    assert.match(html, /class="brte-language-note"/);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /rel="canonical"/);
  }
});

test("selected Infinix, TECNO and itel have distinct visible highlight states", async () => {
  const [style, flow] = await Promise.all([load("public/brte-site.css"),load("src/portal/CustomerFlowV2.tsx")]);
  assert.match(style, /button:nth-child\(1\).*--device-brand: #0ca966/);
  assert.match(style, /button:nth-child\(2\).*--device-brand: #0674ed/);
  assert.match(style, /button:nth-child\(3\).*--device-brand: #e64c45/);
  assert.match(style, /border: 2px solid var\(--device-brand\) !important/);
  assert.match(flow, /aria-pressed=\{form\.brand===brand\}/);
});
