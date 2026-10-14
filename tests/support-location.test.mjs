import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load = async (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Infinix location is present, has a placeholder logo, and avoids unverified repair claims", async () => {
  const [html, db, style] = await Promise.all([
    load("public/pontos-de-apoio/index.html"),
    load("public/pontos-de-apoio/locations.json"),
    load("public/support-points.css"),
  ]);
  const parsed = JSON.parse(db);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.locations.length, 1);
  const item = parsed.locations[0];
  assert.equal(item.id, "br-sp-page-001");
  assert.equal(item.brand, "infinix");
  assert.equal(item.addressLine, "Rua Comendador Afonso Kherlakian, 79");
  assert.equal(item.venue, "Galeria Pagé");
  assert.equal(item.floor, "1º andar");
  assert.equal(item.units, "Lojas 11/12");
  assert.equal(item.city, "São Paulo");
  assert.equal(item.state, "SP");
  assert.equal(item.officialServiceCenter, false);
  assert.equal(item.repairAuthorized, null);
  assert.equal(item.logCollectionAvailable, null);
  assert.equal(item.photo, null);
  assert.match(html, /Rua Comendador Afonso Kherlakian, 79/);
  assert.match(html, /Galeria Pagé · 1º andar · Lojas 11\/12/);
  assert.match(html, /src="\/brandmarks\/infinix.svg"/);
  assert.match(html, /Logo provisório · Fotos em breve/);
  assert.match(html, /Cadastro inicial — serviços a confirmar/);
  assert.match(html, /não constitui confirmação de assistência técnica autorizada/);
  assert.match(html, /google\.com\/maps\/search/);
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.match(html, /href="\/brte-site\.css"/);
  assert.match(style, /points-detail/);
});

test("location route is served before SPA fallback and is visible in support journey", async () => {
  const [vercel, app, flow, help] = await Promise.all([
    load("vercel.json"),
    load("src/App.tsx"),
    load("src/portal/CustomerFlowV2.tsx"),
    load("public/ajuda/index.html"),
  ]);
  const config = JSON.parse(vercel);
  const fallbackIndex = config.rewrites.findIndex((r) => r.source === "/((?!api/).*)");
  const pointsIndex = config.rewrites.findIndex((r) => r.source === "/pontos-de-apoio/");
  assert.ok(fallbackIndex > pointsIndex && pointsIndex >= 0);
  assert.equal(config.rewrites[pointsIndex].destination, "/pontos-de-apoio/index.html");
  assert.match(app, /href="\/pontos-de-apoio\/"/);
  assert.match(flow, /step===2&&!hardware/);
  assert.match(flow, /href="\/pontos-de-apoio\/"/);
  assert.match(help, /href="\/pontos-de-apoio\/"/);
});
