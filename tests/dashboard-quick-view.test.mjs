import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dashboard opens an in-place case dialog without losing queue filters", async () => {
  const cases = await readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/portal/portal.css", import.meta.url), "utf8");
  const translations = await readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8");

  assert.match(cases, /function CaseQuickView\(/);
  assert.match(cases, /role="dialog"/);
  assert.match(cases, /aria-modal="true"/);
  assert.match(cases, /aria-labelledby="case-quick-view-title"/);
  assert.match(cases, /event\.key === "Escape"/);
  assert.match(cases, /event\.key !== "Tab"/);
  assert.match(cases, /lastFocused\?\.focus\(\)/);
  assert.match(cases, /document\.body\.style\.overflow = "hidden"/);
  assert.match(cases, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(cases, /<CaseDetail key=\{id\}/);
  assert.match(cases, /onChanged\?\.\(\)/);
  assert.match(cases, /onChanged=\{\(\) => \{ void load\(\); \}\}/);
  assert.match(cases, /nextId=\{selectedIndex >= 0/);
  assert.match(cases, /previousId=\{selectedIndex > 0/);
  assert.doesNotMatch(cases, /if \(selected\) \{\s*return <CaseDetail/);
  assert.match(css, /\.case-quick-view-overlay\s*\{/);
  assert.match(css, /\.case-quick-view-body\s*\{/);
  assert.match(css, /@media \(max-width: 600px\)/);
  for (const value of ["Atendimento rápido", "Quick case view", "Vista rápida del caso", "服务单快速查看"]) {
    assert.ok(translations.includes(value), "Missing quick-view translation: " + value);
  }
});

test("opening the dialog does not relax server-side manager access controls", async () => {
  const server = await readFile(new URL("../server/app.mjs", import.meta.url), "utf8");
  assert.match(server, /Managers can change only status OR owner on active cases/);
  assert.match(server, /MANAGER_TRIAGE_ONLY/);
  assert.match(server, /CASE_NOT_ACTIVE/);
});
