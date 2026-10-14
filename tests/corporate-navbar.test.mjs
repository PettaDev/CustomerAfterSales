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
  assert.match(app, /setPortalLanguage\(code\)/);
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

test("desktop navigation has one primary call to action and no redundant brand headings", async () => {
  const [app, css, intake, help, helpBehavior] = await Promise.all([
    load("src/App.tsx"),
    load("public/brte-site.css"),
    load("src/portal/CustomerFlowV2.tsx"),
    load("public/ajuda/index.html"),
    load("public/brte-site.js"),
  ]);
  assert.match(css, /\.portal \.brte-site-header \.brte-nav a\.brte-mobile-cta \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 850px\)/);
  assert.match(app, /className="brte-header-cta"/);
  assert.match(app, /create: "Novo atendimento"/);
  assert.match(intake, /SUPORTE AO DISPOSITIVO/);
  assert.match(intake, /SEU ATENDIMENTO/);
  assert.doesNotMatch(intake, /eyebrow">BRTE/);
  assert.match(help, /GUIAS E SOLUÇÕES/);
  assert.doesNotMatch(help, /Autoatendimento BRTE/);
  assert.match(help, /class="brte-language-note" aria-live="polite" hidden/);
  assert.match(helpBehavior, /note\.hidden = language === "pt-BR"/);
  for (const path of guidePaths) {
    const doc = await load(path);
    assert.match(doc, /class="brte-language-note" aria-live="polite" hidden/);
  }
});

test("support locations appear in main navigation for every language and static help page", async () => {
  const [app, behavior, store, ...articles] = await Promise.all([
    load("src/App.tsx"), load("public/brte-site.js"),
    load("public/pontos-de-apoio/index.html"),
    ...guidePaths.map(load),
  ]);
  assert.match(app, /href="\/pontos-de-apoio\/" onClick=\{\(\)=>setMenuOpen\(false\)\}>\{nav\.locations\}<\/a>/);
  assert.match(behavior, /locations:"Pontos de apoio"/);
  assert.match(behavior, /locations:"Support locations"/);
  assert.match(behavior, /locations:"Puntos de apoyo"/);
  assert.match(behavior, /locations:"线下支持点"/);
  for (const html of [store, ...articles]) {
    assert.match(html, /href="\/pontos-de-apoio\/"[^>]*data-nav-key="locations"/);
    assert.match(html, /href="\/privacy\/"/);
    assert.match(html, /href="\/cookies\/"/);
  }
});

test("privacy and cookie pages exist but cannot be treated as approved corporate policies", async () => {
  const [privacy, cookies, vercel, app] = await Promise.all([
    load("public/privacy/index.html"), load("public/cookies/index.html"),
    load("vercel.json"), load("src/App.tsx"),
  ]);
  const rewrites = JSON.parse(vercel).rewrites;
  for (const name of ["privacy", "cookies"]) {
    const i = rewrites.findIndex((x) => x.source === "/" + name + "/");
    assert.ok(i >= 0);
    assert.equal(rewrites[i].destination, "/" + name + "/index.html");
  }
  for (const doc of [privacy, cookies]) {
    assert.match(doc, /name="robots" content="noindex,follow"/);
    assert.match(doc, /Documento preliminar/);
    assert.match(doc, /href="\/brte-site\.css"/);
  }
  assert.match(privacy, /Transsion Holdings AfterSales/);
  assert.match(privacy, /63\.920\.932\/0001-72/);
  assert.match(privacy, /gustavo\.petta@transsion\.com/);
  assert.match(privacy, /Gustavo Teixeira de Petta/);
  assert.match(cookies, /brte-theme/);
  assert.match(cookies, /aftercare-language/);
  assert.match(app, /href="\/cookies\/"/);
});
