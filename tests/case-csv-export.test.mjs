import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { makeCasesCsv } from "../src/portal/case-export.ts";

const base = {
  id: "CAS-0001",
  brand: "infinix",
  model: "X6852",
  build: "15.1.2",
  category: "software",
  problem: "Falha na atualização",
  description: 'Após atualizar,\nrecebo erro; mensagem: "OTA"',
  expected: "Instalar OTA normalmente",
  name: "Cliente Exemplo",
  email: "cliente@example.com",
  phone: "+55 11 98765-4321",
  country: "Brasil",
  state: "SP",
  city: "São Paulo",
  carrier: "Claro",
  status: "received",
  priority: "normal",
  owner: "",
  moderationState: "active",
  createdAt: "2026-10-20T20:21:40.000Z",
};

test("case CSV exports selected data with UTF-8 BOM, Excel-friendly delimiters and quoting", () => {
  const csv = makeCasesCsv([base]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Protocolo";"Recebido em";"Cliente"'));
  assert.ok(csv.includes('"CAS-0001"'));
  assert.ok(csv.includes('"São Paulo"'));
  assert.ok(csv.includes('"Falha na atualização"'));
  assert.ok(csv.includes('"Após atualizar,\nrecebo erro; mensagem: ""OTA"""'));
  assert.ok(csv.includes("\"\'+55 11 98765-4321\""));
  assert.ok(csv.includes('"Recebido"'));
  assert.ok(csv.includes('"Não atribuído"'));
  assert.equal((csv.match(/"CAS-0001"/g) || []).length, 1);
});

test("CSV neutralizes spreadsheet formulas from customer-controlled fields", () => {
  const csv = makeCasesCsv([{
    ...base,
    id: "CAS-0002",
    name: '=HYPERLINK("https://example.invalid")',
    email: "@sum",
    problem: "\t=1+1",
    description: "  -cmd",
    owner: "+IMPORTXML",
  }]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("'@sum"));
  assert.ok(csv.includes("'\t=1+1"));
  assert.ok(csv.includes("'  -cmd"));
  assert.ok(csv.includes("'+IMPORTXML"));
  assert.ok(!csv.includes(';"=HYPERLINK'));
});

test("dashboard selection is explicit, reset on filter changes and works with the existing modal", async () => {
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");
  const ui = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/portal/portal.css", import.meta.url), "utf8");
  assert.match(cases, /selectedCaseIds/);
  assert.match(cases, /toggleVisible/);
  assert.match(cases, /aria-label=\{ui\.selectAllVisible\}/);
  assert.match(cases, /aria-label=\{uiFormat\(ui\.selectOneCase/);
  assert.match(cases, /disabled=\{!selectedCount\}/);
  assert.match(cases, /makeCasesCsv\(selectedCases\)/);
  assert.match(cases, /setScope\(value\); setSelectedCaseIds\(new Set\(\)\)/);
  assert.match(cases, /setQuery\(e\.target\.value\); setSelectedCaseIds\(new Set\(\)\)/);
  assert.match(cases, /<CaseQuickView/);
  assert.match(css, /\.case-row-checkbox/);
  for (const item of ["Exportar CSV", "Export CSV", "导出 CSV"]) assert.ok(ui.includes(item));
});
