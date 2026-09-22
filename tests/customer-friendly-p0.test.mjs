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
