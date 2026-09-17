import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("hardware Step 3 is manual photo/video evidence only", async () => {
  const flow = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");
  const hardware = await readFile(new URL("../src/portal/HardwareCollection.tsx", import.meta.url), "utf8");

  assert.match(flow, /hardware \? <HardwareCollection/);
  assert.match(flow, /!hardware && !collectionMethod/);
  assert.match(hardware, /accept=\"image\/png,image\/jpeg,video\/mp4/);
  assert.doesNotMatch(hardware, /\.zip|\.log|\.txt/);
});

test("hardware guidance covers charger, warranty follow-up and pre-shipment validation in all languages", async () => {
  const source = await readFile(new URL("../src/portal/HardwareCollection.tsx", import.meta.url), "utf8");
  for (const marker of [
    "Mostre o aparelho conectado ao carregador",
    "Muestra el dispositivo conectado al cargador",
    "请展示设备连接充电器的状态",
    "Show the device connected to its charger",
    "WhatsApp",
    "Só envie o aparelho depois de receber as instruções",
    "Envía el dispositivo solo después de recibir las instrucciones",
    "只有在收到支持团队的明确说明后再寄送设备",
    "Send the device only after you receive support instructions",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("notes remain optional with no minimum character requirement", async () => {
  const source = await readFile(new URL("../src/portal/CustomerFlowV2.tsx", import.meta.url), "utf8");
  assert.match(source, /no minimum character requirement/);
  assert.match(source, /não têm quantidade mínima de caracteres/);
  assert.match(source, /没有最少字符数限制/);
  assert.doesNotMatch(source, /description[^\n]*minLength/);
});
