import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");
const pages = [
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

test("all public static pages share the same semantic footer and routes", async () => {
  const html = await Promise.all(pages.map(read));
  const footers = html.map((page, index) => {
    assert.match(page, /<\/main>\s*<footer class="brte-unified-footer"/, pages[index]);
    const match = page.match(/<footer class="brte-unified-footer"[^>]*>[\s\S]*?<\/footer>/);
    assert.ok(match, "missing shared footer in " + pages[index]);
    return match[0];
  });
  assert.ok(footers.every((value) => value === footers[0]));
  const links = [...footers[0].matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(links, ["/", "/ajuda/", "/pontos-de-apoio/", "/tracking", "/", "/privacy/", "/cookies/", "/dashboard"]);
});

test("React has a single unified footer including guide/capture routes", async () => {
  const app = await read("src/App.tsx");
  assert.equal((app.match(/className="brte-unified-footer"/g) || []).length, 1);
  assert.equal(app.split('href="/dashboard"').length - 1, 1, "staff access only in footer");
  assert.match(app, /if \(page === "guide"\) return/);
  assert.match(app, /page === "capture"/);
  for (const route of ["/ajuda/", "/pontos-de-apoio/", "/tracking", "/privacy/", "/cookies/", "/dashboard"]) {
    assert.ok(app.includes('href="' + route + '"'), "missing " + route);
  }
});

test("footer styling supports mobile and four localized sets of labels", async () => {
  const [css, script, i18n] = await Promise.all([
    read("public/brte-site.css"), read("public/brte-site.js"), read("src/portal/portal-i18n.ts"),
  ]);
  assert.match(css, /\.brte-unified-footer \.brte-footer-top/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 340px\)/);
  assert.match(css, /\.brte-unified-footer a:focus-visible/);
  for (const key of ["footerNavigation", "footerInformation", "footerCookies"]) {
    assert.equal((i18n.match(new RegExp(key + ":", "g")) || []).length, 4);
  }
  for (const key of ["footerNavigation", "footerInformation", "footerSupport", "footerTeam", "footerCredit"]) {
    assert.equal((script.match(new RegExp(key + ":", "g")) || []).length, 4);
  }
});
