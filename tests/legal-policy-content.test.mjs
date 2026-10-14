import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load = async (file) => readFile(new URL("../" + file, import.meta.url), "utf8");
const pages = ["public/privacy/index.html", "public/cookies/index.html"];

test("BRTE policies use supplied identity and protect draft from indexation", async () => {
  for (const path of pages) {
    const html = await load(path);
    for(const data of ["Transsion Holdings AfterSales", "63.920.932/0001-72", "Gustavo Teixeira de Petta", "gustavo.petta@transsion.com"]) {
      assert.ok(html.includes(data), path + " missing " + data);
    }
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert.match(html, /Documento preliminar/);
    assert.match(html, /href="mailto:gustavo\.petta@transsion\.com/);
    assert.match(html, /class="brte-site-header"/);
    assert.match(html, /class="policy-contact"/);
    assert.match(html, /<nav class="policy-toc"/);
    assert.match(html, /id="sec-1"/);
    assert.ok((html.match(/class="policy-section"/g)||[]).length >= 7);
  }
});

test("privacy discloses support, diagnostic logs, vendors, rights and unknown retention", async () => {
  const html = await load("public/privacy/index.html");
  for(const term of ["ADB/WebUSB", "evidências", "Vercel", "Neon/PostgreSQL", "Resend", "ANPD", "revogar", "armazenamento", "retenção", "ainda não possui uma tabela corporativa aprovada"]) {
    assert.ok(html.includes(term), "Missing disclosure: " + term);
  }
  assert.match(html, /não constitui, por si só, designação formal de encarregado/);
});

test("cookie policy describes actual browser data without inventing advertising consent", async () => {
  const html = await load("public/cookies/index.html");
  for (const term of ["tfae", "case-access", "aftercare-language", "brte-theme", "transsion-guide-session-v2", "até 8 horas", "7 dias", "consentimento"]) {
    assert.ok(html.includes(term), "Missing cookie notice: " + term);
  }
  assert.ok(html.includes("Esta política não declara a inexistência de tecnologias de terceiros"));
  assert.ok(html.includes("não exigem um banner artificial"));
});
