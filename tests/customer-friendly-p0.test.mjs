import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("customer-friendly P0 removes technical blockers from the main flow", async () => {
  const source = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");

  assert.match(source, /brand: ""/);
  assert.match(source, /category: ""/);
  assert.match(source, /tx\("software"\).*tx\("optional"\)/s);
  assert.doesNotMatch(source, /requiredProps\("build"\)/);
  assert.doesNotMatch(source, /requiredProps\("carrier"\)/);
  assert.match(source, /browserCollectionAvailable/);
  assert.match(source, /"usb" in navigator/);
  assert.doesNotMatch(source, /href="\/guide"/);
});

test("simple mobile evidence copy exists in all four portal languages", async () => {
  const source = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");
  for (const marker of [
    "Sem comandos ou configurações avançadas",
    "Sin comandos ni configuraciones avanzadas",
    "无需命令或高级设置",
    "No commands or advanced settings",
    "Coleta avançada somente quando o suporte solicitar",
    "Recopilación avanzada solo cuando soporte la solicite",
    "仅在支持团队要求时进行高级采集",
    "Advanced collection only when support requests it",
  ]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
  }
});


test("public guide route no longer exposes brand-selected OEM logger procedures", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const portalI18n = await readFile(new URL("../src/portal/portal-i18n.ts", import.meta.url), "utf8");

  assert.doesNotMatch(app, /import\("\.\/GuideApp"\)/);
  assert.match(app, /advancedCollectionTitle/);
  assert.match(portalI18n, /Não use comandos, menus de engenharia ou ferramentas de logs por conta própria/);
  assert.match(portalI18n, /Do not use commands, engineering menus, or log tools on your own/);
  assert.match(portalI18n, /No uses comandos, menús de ingeniería ni herramientas de logs por tu cuenta/);
  assert.match(portalI18n, /请勿自行使用命令、工程菜单或日志工具/);
});
