import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const staticPages = [
  "public/ajuda/index.html",
  "public/ajuda/aplicativo-fecha/index.html",
  "public/ajuda/aquecimento-bateria/index.html",
  "public/ajuda/atualizacao-sistema/index.html",
  "public/ajuda/rede-movel-sms/index.html",
  "public/ajuda/wifi-desconecta/index.html",
  "public/pontos-de-apoio/index.html",
  "public/privacy/index.html",
  "public/cookies/index.html",
];

test("React and all static pages share one semantically structured footer with the same URLs", async () => {
  const app = await read("src/App.tsx");
  assert.equal((app.match(/className="brte-unified-footer"/g) || []).length, 1);
  assert.match(app, /className="brte-footer-inner"/);
  for (const href of ["/ajuda/", "/pontos-de-apoio/", "/tracking", "/", "/privacy/", "/cookies/", "/dashboard"]) {
    assert.ok(app.includes('href="' + href + '"'), "missing portal footer destination " + href);
  }
  assert.equal(app.split('href="/dashboard"').length - 1, 1, "no staff sign-in in customer header");
  assert.match(app, /page === "guide" \|\| page === "capture"/);
  const htmlPages = await Promise.all(staticPages.map(read));
  const footers = [];
  for (let i = 0; i < htmlPages.length; i++) {
    const html = htmlPages[i];
    const footer = html.match(/<footer class="brte-unified-footer"[^>]*>[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, "unified footer missing in " + staticPages[i]);
    assert.match(html, /<\/main>\s*<footer class="brte-unified-footer"/);
    assert.equal((html.match(/class="brte-unified-footer"/g) || []).length, 1);
    const hrefs = [...footer.matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(hrefs, ["/", "/ajuda/", "/pontos-de-apoio/", "/tracking", "/", "/privacy/", "/cookies/", "/dashboard"]);
    footers.push(footer);
  }
  assert.ok(footers.every((item) => item === footers[0]), "all static documents use identical footer HTML");
});

test("shared footer labels follow existing pt/en/es/zh language and theme preferences", async () => {
  const [appI18n, staticI18n, site, css] = await Promise.all([
    read("src/portal/portal-i18n.ts"), read("public/brte-site.js"),
    read("src/App.tsx"), read("public/brte-site.css"),
  ]);
  for (const name of ["footerNavigation", "footerInformation", "footerCookies"]) {
    assert.equal((appI18n.match(new RegExp(name + ":", "g")) || []).length, 4);
  }
  for (const name of ["footerNavigation", "footerInformation", "footerSupport", "footerPrivacy", "footerCookies", "footerTeam", "footerCredit"]) {
    assert.equal((staticI18n.match(new RegExp(name + ":", "g")) || []).length, 4);
  }
  assert.match(site, /tx\("footerSupport"\)/);
  assert.match(css, /\.brte-unified-footer \.brte-footer-top/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /:focus-visible/);
});

test("TFAE and Manager workspace is organized, role-sensitive and mobile case rows have labels", async () => {
  const [cases, css] = await Promise.all([read("src/portal/Cases.tsx"), read("src/portal/workspace.css")]);
  for (const marker of [
    "workspace-heading", "workspace-team-grid", "workspace-team-card",
    "workspace-filter-options", "workspace-search", "workspace-metrics",
    "cases-table", "workspace-open-case", "workspace-readonly",
  ]) assert.ok(cases.includes(marker), "missing workspace structure " + marker);
  for (const key of ["ui.caseProblem", "ui.device", "ui.status", "ui.owner", "ui.priority", "ui.received"]) {
    assert.ok(cases.includes("data-label={" + key + "}"), "mobile case metadata not labeled " + key);
  }
  assert.match(cases, /staffUser\?\.role === "manager" \? \[\] : \[\["mine"/);
  assert.match(cases, /aria-pressed=\{filter === value\}/);
  assert.match(cases, /aria-pressed=\{moderationFilter === value\}/);
  assert.match(cases, /aria-pressed=\{scope === value\}/);
  assert.match(css, /@media \(max-width: 1050px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 370px\)/);
  assert.match(css, /\.cases-table td::before/);
  assert.match(css, /\.detail \.detail-grid/);
  assert.match(cases, /const canEdit = staff && staffProfile\?\.role === "tfae"/);
});
