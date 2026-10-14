import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fromRoot = async (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("the help center is statically crawlable and linked to customer intake", async () => {
  const index = await fromRoot("public/ajuda/index.html");
  const app = await fromRoot("src/App.tsx");
  const flow = await fromRoot("src/portal/CustomerFlowV2.tsx");
  const sitemap = await fromRoot("public/sitemap.xml");
  const routes = JSON.parse(await fromRoot("vercel.json")).rewrites;
  const fallback = routes.findIndex((route) => route.source === "/((?!api/).*)");
  assert.ok(fallback >= 0);
  assert.ok(index.includes('<html lang="pt-BR">'));
  assert.ok(index.includes('name="description"'));
  assert.ok(index.includes('rel="canonical"'));
  assert.ok(index.includes('href="/ajuda/wifi-desconecta/"'));
  assert.ok(index.includes('href="/ajuda/aplicativo-fecha/"'));
  assert.ok(app.includes('href="/ajuda/"'));
  assert.ok(flow.includes('params.get("problem")'));
  assert.ok(flow.includes('params.get("category")'));
  assert.ok(routes.findIndex((route) => route.source === "/ajuda/:slug/") < fallback);
  assert.ok(sitemap.includes("https://customers-guide.vercel.app/ajuda/"));
  for (const slug of [
    "wifi-desconecta", "aplicativo-fecha", "rede-movel-sms",
    "aquecimento-bateria", "atualizacao-sistema",
  ]) {
    const article = await fromRoot("public/ajuda/" + slug + "/index.html");
    assert.match(article, /<h1>[^<]+<\/h1>/);
    assert.ok(article.includes('name="description"'));
    assert.ok(article.includes('rel="canonical"'));
    assert.ok(article.includes('href="/?category=software&amp;problem='));
    assert.ok(article.includes("não uma confirmação de problema conhecido"));
    assert.ok(sitemap.includes("/ajuda/" + slug + "/"));
  }
});

test("BRTE does not publish internal or unreviewed known issues", async () => {
  const index = await fromRoot("public/ajuda/index.html");
  assert.ok(index.includes("Informações sobre bugs em investigação serão publicadas apenas após validação"));
  assert.ok(!index.includes("JIRA-"));
});
