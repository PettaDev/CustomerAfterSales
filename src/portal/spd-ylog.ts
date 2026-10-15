/* SPD/Unisoc WebUSB YLog automation adapted from QA Toolbox (MobileQA.LoggerApp.ps1).
 * UI coordinates are calculated from live resource-id bounds. Never delete existing logs.
 */
export type ShellFn = (adb: any, command: string | string[]) => Promise<string>;
export type ReadRemoteFileFn = (adb: any, path: string) => Promise<Uint8Array>;
export const SPD_PACKAGE = "com.sprd.logmanager";
export const SPD_ACTIVITY = "com.sprd.logmanager/.logui.LogMainActivity";
export const SPD_LOG_ROOT = "/data/ylog";
export const SPD_SWITCHES = ["ap_log", "modem_log", "wcn_log", "other_log"] as const;
const TOGGLE_ID = SPD_PACKAGE + ":id/switch_button";
const MAX_FILES = 80;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const MAX_FILE_BYTES = 128 * 1024 * 1024;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const remoteImport = (url: string): Promise<any> => import(/* @vite-ignore */ url);

export function parseYLogBounds(value: string | null) {
  const match = value?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  if (!match) return null;
  const [left, top, right, bottom] = match.slice(1).map(Number);
  if (right <= left || bottom <= top || right > 20000 || bottom > 20000) return null;
  return { x: Math.floor((left + right) / 2), y: Math.floor((top + bottom) / 2) };
}
export function newYLogPaths(previous: readonly string[], current: readonly string[]) {
  const old = new Set(previous);
  return [...new Set(current)].filter(file => file.startsWith(SPD_LOG_ROOT + "/") &&
    file.endsWith(".ylog") && !file.includes("..") && !/[\r\n\0]/.test(file) && !old.has(file));
}
function parseUi(xml: string): Document {
  const start = xml.indexOf("<");
  if (start < 0) throw new Error("A tela do YLog não retornou XML.");
  const doc = new DOMParser().parseFromString(xml.slice(start), "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Não foi possível ler a tela do YLog.");
  return doc;
}
function nodes(doc: Document) { return Array.from(doc.getElementsByTagName("node")); }
function byId(doc: Document, id: string) {
  return nodes(doc).find(node => node.getAttribute("resource-id") === id);
}
function byText(doc: Document, text: string) {
  return nodes(doc).find(node => node.getAttribute("text") === text);
}
async function dumpUi(adb: any, shell: ShellFn) {
  const path = "/sdcard/brte_ylog_ui_" + Date.now().toString(36) + ".xml";
  try {
    await shell(adb, ["uiautomator", "dump", path]);
    return parseUi(await shell(adb, ["cat", path]));
  } finally { await shell(adb, ["rm", "-f", path]).catch(() => ""); }
}
async function tap(adb: any, shell: ShellFn, node: Element) {
  const center = parseYLogBounds(node.getAttribute("bounds"));
  if (!center) throw new Error("O controle do YLog não tem coordenadas válidas.");
  await shell(adb, ["input", "tap", String(center.x), String(center.y)]);
}
function toggle(doc: Document) {
  const node = byId(doc, TOGGLE_ID);
  if (!node || !parseYLogBounds(node.getAttribute("bounds"))) return null;
  const label = (node.getAttribute("text") || "").trim().toLowerCase();
  if (label === "start") return { node, state: "stopped" as const };
  if (label === "stop") return { node, state: "running" as const };
  return null; // Never tap unknown/localized labels.
}
async function openMain(adb: any, shell: ShellFn) {
  await shell(adb, ["input", "keyevent", "224"]).catch(() => "");
  await shell(adb, ["am", "start", "--activity-clear-top", "-n", SPD_ACTIVITY]);
  for (let i = 0; i < 10; i++) {
    const doc = await dumpUi(adb, shell).catch(() => null);
    if (doc && toggle(doc)) return doc;
    await sleep(400);
  }
  throw new Error("A tela START/STOP do YLog não foi encontrada. Desbloqueie o aparelho.");
}
async function waitState(adb: any, shell: ShellFn, expected: "running" | "stopped") {
  for (let i = 0; i < 16; i++) {
    const doc = await dumpUi(adb, shell).catch(() => null);
    if (doc && toggle(doc)?.state === expected) return;
    await sleep(500);
  }
  throw new Error("O YLog não confirmou o estado " + expected + ".");
}
async function openCustom(adb: any, shell: ShellFn) {
  const main = await openMain(adb, shell);
  const toolbar = byId(main, "android:id/action_bar");
  const children = toolbar ? Array.from(toolbar.getElementsByTagName("node")) : [];
  const overflow = children.find(node => node.getAttribute("clickable") === "true" &&
    ["android.widget.ImageButton", "android.widget.ImageView"].includes(node.getAttribute("class") || "") &&
    parseYLogBounds(node.getAttribute("bounds")));
  if (!overflow) throw new Error("O menu do YLog não foi encontrado nesta versão.");
  await tap(adb, shell, overflow);
  let item: Element | undefined;
  for (let i = 0; i < 10; i++) {
    const doc = await dumpUi(adb, shell).catch(() => null);
    item = doc ? byText(doc, "Custom") : undefined;
    if (item) break;
    await sleep(450);
  }
  if (!item) throw new Error("A opção Custom do YLog não está disponível.");
  await tap(adb, shell, item);
}
function rowSwitch(doc: Document, name: typeof SPD_SWITCHES[number]) {
  const row = byId(doc, SPD_PACKAGE + ":id/" + name);
  if (!row) return null;
  return Array.from(row.getElementsByTagName("node")).find(node =>
    node.getAttribute("class") === "android.widget.Switch" &&
    parseYLogBounds(node.getAttribute("bounds"))) || null;
}
async function ensureSwitches(adb: any, shell: ShellFn) {
  await openCustom(adb, shell);
  try {
    for (const name of SPD_SWITCHES) {
      let node: Element | null = null;
      for (let i = 0; i < 10; i++) {
        const doc = await dumpUi(adb, shell).catch(() => null);
        node = doc ? rowSwitch(doc, name) : null;
        if (node) break;
        await sleep(450);
      }
      if (!node) throw new Error("O controle " + name + " não foi encontrado no YLog.");
      if (node.getAttribute("checked") !== "true") {
        await tap(adb, shell, node);
        let confirmed = false;
        for (let i = 0; i < 12; i++) {
          await sleep(450);
          const doc = await dumpUi(adb, shell).catch(() => null);
          if (doc && rowSwitch(doc, name)?.getAttribute("checked") === "true") {
            confirmed = true; break;
          }
        }
        if (!confirmed) throw new Error("O YLog não confirmou a ativação de " + name + ".");
      }
    }
  } finally { await shell(adb, ["input", "keyevent", "3"]).catch(() => ""); }
}
async function listFiles(adb: any, shell: ShellFn) {
  const out = await shell(adb, ["find", SPD_LOG_ROOT, "-type", "f", "-name", "*.ylog"]);
  if (/permission denied|not found|no such file/i.test(out))
    throw new Error("Os arquivos do YLog não estão acessíveis por ADB neste firmware.");
  return out.split(/\r?\n/).map(x => x.trim()).filter(x => x.startsWith(SPD_LOG_ROOT + "/"));
}
export async function detectSpdYLog(adb: any, shell: ShellFn) {
  const [soc, hardware, board, installed] = await Promise.all([
    shell(adb, ["getprop", "ro.soc.manufacturer"]).catch(() => ""),
    shell(adb, ["getprop", "ro.hardware"]).catch(() => ""),
    shell(adb, ["getprop", "ro.board.platform"]).catch(() => ""),
    shell(adb, ["pm", "path", SPD_PACKAGE]).catch(() => ""),
  ]);
  return /sprd|spreadtrum|unisoc|\bums\d+|\bsp\d+/i.test(soc + " " + hardware + " " + board) &&
    installed.includes("package:");
}
export async function startSpdYLog(adb: any, shell: ShellFn): Promise<string[]> {
  const baseline = await listFiles(adb, shell);
  if (toggle(await openMain(adb, shell))?.state !== "stopped")
    throw new Error("O YLog já está executando. Pare a coleta anterior antes de iniciar.");
  try {
    // Enabling log categories may itself start a new YLog session.
    await ensureSwitches(adb, shell);
    const main = await openMain(adb, shell);
    const current = toggle(main);
    if (!current) throw new Error("Não foi possível identificar START/STOP do YLog.");
    if (current.state === "stopped") {
      await tap(adb, shell, current.node);
      await waitState(adb, shell, "running");
    }
    let fresh = false;
    for (let i = 0; i < 14; i++) {
      if (newYLogPaths(baseline, await listFiles(adb, shell)).length) { fresh = true; break; }
      await sleep(550);
    }
    if (!fresh) throw new Error("O YLog não produziu arquivos novos após iniciar.");
    await shell(adb, ["input", "keyevent", "3"]).catch(() => "");
    return baseline;
  } catch (error) {
    // Only cleanup after the initial stopped state was explicitly confirmed.
    await stopSpdYLog(adb, shell).catch(() => "");
    throw error;
  }
}
export async function stopSpdYLog(adb: any, shell: ShellFn) {
  const state = toggle(await openMain(adb, shell));
  if (!state) throw new Error("Não foi possível identificar a finalização do YLog.");
  if (state.state === "running") {
    await tap(adb, shell, state.node);
    await waitState(adb, shell, "stopped");
  }
  await sleep(2000);
  await shell(adb, ["input", "keyevent", "3"]).catch(() => "");
}
export async function pullSpdYLog(
  adb: any, shell: ShellFn, readRemoteFile: ReadRemoteFileFn,
  baseline: readonly string[], onProgress: (current: number, total: number) => void,
): Promise<File[]> {
  const paths = newYLogPaths(baseline, await listFiles(adb, shell));
  if (!paths.length) throw new Error("Nenhum arquivo novo do YLog foi localizado.");
  if (paths.length > MAX_FILES) throw new Error("Muitos arquivos YLog para o navegador.");
  const entries: Record<string, Uint8Array> = {};
  let total = 0;
  for (let i = 0; i < paths.length; i++) {
    const file = paths[i];
    const length = Number((await shell(adb, ["stat", "-c", "%s", file])).trim());
    if (!Number.isSafeInteger(length) || length <= 0 || length > MAX_FILE_BYTES ||
        total + length > MAX_TOTAL_BYTES)
      throw new Error("Os logs YLog excedem o limite seguro da coleta pelo navegador.");
    let bytes: Uint8Array | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { bytes = await readRemoteFile(adb, file); break; }
      catch (err) {
        if (attempt === 2) throw err;
        await sleep(500 * (attempt + 1));
      }
    }
    if (!bytes || bytes.byteLength !== length) throw new Error("Um arquivo YLog foi recebido incompleto.");
    total += bytes.byteLength;
    entries["ylog/" + file.slice(SPD_LOG_ROOT.length + 1)] = bytes;
    onProgress(i + 1, paths.length);
  }
  const { zipSync } = await remoteImport("https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm");
  const compressed = zipSync(entries, { level: 3 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return [new File([compressed], "brte-ylog-spd-" + stamp + ".zip", { type: "application/zip" })];
}
