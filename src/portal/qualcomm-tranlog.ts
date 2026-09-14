export type ShellFn = (adb: any, command: string | string[]) => Promise<string>;
export type ReadRemoteFileFn = (adb: any, path: string) => Promise<Uint8Array>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const QUALCOMM_PACKAGE = "com.transsion.TranLogManager";
export const QUALCOMM_ACTIVITY = `${QUALCOMM_PACKAGE}/.TranLogManageActivity`;
export const QUALCOMM_LOG_ROOT = "/data/debuglogger";

const SWITCHES = [
  { rowId: `${QUALCOMM_PACKAGE}:id/ap_log`, label: "Mobile Log" },
  { rowId: `${QUALCOMM_PACKAGE}:id/modem_log`, label: "Modem Log" },
  { rowId: `${QUALCOMM_PACKAGE}:id/wcn_log`, label: "Connectivity Log" },
  { rowId: `${QUALCOMM_PACKAGE}:id/other_log`, label: "Other Log" },
];

function parseBounds(value: string | null) {
  const match = value?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  if (!match) return null;
  const [, x1, y1, x2, y2] = match.map(Number);
  return {
    x: Math.round((x1 + x2) / 2),
    y: Math.round((y1 + y2) / 2),
    top: y1,
  };
}

function parseUi(xml: string) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Não foi possível ler a tela de diagnóstico do aparelho.");
  }
  return doc;
}

function nodes(doc: Document) {
  return Array.from(doc.getElementsByTagName("node"));
}

function byResource(doc: Document, resourceId: string) {
  return nodes(doc).find((node) => node.getAttribute("resource-id") === resourceId);
}

function byText(doc: Document, text: string) {
  return nodes(doc).find((node) => node.getAttribute("text") === text);
}

function checkboxFor(doc: Document, rowId: string) {
  const row = byResource(doc, rowId);
  if (!row) return undefined;
  return Array.from(row.getElementsByTagName("node")).find(
    (node) => node.getAttribute("resource-id") === `${QUALCOMM_PACKAGE}:id/checkbox`,
  );
}

async function tap(adb: any, shell: ShellFn, node: Element) {
  const center = parseBounds(node.getAttribute("bounds"));
  if (!center) throw new Error("Não foi possível localizar um controle na tela.");
  await shell(adb, ["input", "tap", String(center.x), String(center.y)]);
}

async function dumpUi(adb: any, shell: ShellFn) {
  const path = `/sdcard/aftercare_ui_${Date.now().toString(36)}.xml`;
  try {
    await shell(adb, ["uiautomator", "dump", path]);
    return await shell(adb, ["cat", path]);
  } finally {
    await shell(adb, ["rm", "-f", path]).catch(() => "");
  }
}

async function keepReady(adb: any, shell: ShellFn) {
  await shell(adb, ["input", "keyevent", "224"]).catch(() => "");
  await shell(adb, ["svc", "power", "stayon", "true"]).catch(() => "");
  await shell(adb, ["wm", "dismiss-keyguard"]).catch(() => "");
}

async function openMain(adb: any, shell: ShellFn) {
  await keepReady(adb, shell);
  await shell(adb, ["am", "start", "-n", QUALCOMM_ACTIVITY]);
  await sleep(850);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const doc = parseUi(await dumpUi(adb, shell));
    if (byResource(doc, `${QUALCOMM_PACKAGE}:id/switch_button`)) return doc;
    await keepReady(adb, shell);
    await shell(adb, ["am", "start", "-n", QUALCOMM_ACTIVITY]);
    await sleep(700);
  }
  throw new Error("Não foi possível abrir a preparação de diagnóstico do aparelho.");
}

function overflowNode(doc: Document) {
  const named = nodes(doc).find((node) =>
    /mais opções|more options/i.test(node.getAttribute("content-desc") || ""),
  );
  if (named) return named;
  return nodes(doc).find((node) => {
    if (node.getAttribute("class") !== "android.widget.ImageView") return false;
    if (node.getAttribute("clickable") !== "true") return false;
    const center = parseBounds(node.getAttribute("bounds"));
    return Boolean(center && center.top < 320);
  });
}

function isSwitchScreen(doc: Document) {
  return SWITCHES.every(({ rowId }) => Boolean(byResource(doc, rowId)));
}

async function ensureSwitchScreen(adb: any, shell: ShellFn) {
  try {
    const current = parseUi(await dumpUi(adb, shell));
    if (isSwitchScreen(current)) return current;
  } catch {}

  const main = await openMain(adb, shell);
  const overflow = overflowNode(main);
  if (!overflow) throw new Error("Não foi possível abrir as opções de diagnóstico.");
  await tap(adb, shell, overflow);
  await sleep(350);

  const menu = parseUi(await dumpUi(adb, shell));
  const logSwitch = byText(menu, "Log Switch");
  if (!logSwitch) throw new Error("A opção de preparação de logs não foi encontrada.");
  await tap(adb, shell, logSwitch);
  await sleep(500);

  const switches = parseUi(await dumpUi(adb, shell));
  if (!isSwitchScreen(switches)) throw new Error("A tela de preparação não abriu corretamente.");
  return switches;
}

async function waitLogger(adb: any, shell: ShellFn, running: boolean) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const [enabled, mainlog] = await Promise.all([
      shell(adb, ["getprop", "persist.sys.tranlogmanager.enable"]).catch(() => ""),
      shell(adb, ["getprop", "init.svc.mainlogcat"]).catch(() => ""),
    ]);
    const isRunning = enabled.trim() === "1" && mainlog.trim() === "running";
    const isStopped = enabled.trim() !== "1" && mainlog.trim() !== "running";
    if ((running && isRunning) || (!running && isStopped)) return;
    await sleep(400);
  }
  throw new Error(running ? "Os registros técnicos não iniciaram." : "Os registros técnicos não finalizaram.");
}

export async function detectQualcommTranLog(adb: any, shell: ShellFn) {
  const [soc, hardware, board, pkg] = await Promise.all([
    shell(adb, ["getprop", "ro.soc.manufacturer"]).catch(() => ""),
    shell(adb, ["getprop", "ro.hardware"]).catch(() => ""),
    shell(adb, ["getprop", "ro.board.platform"]).catch(() => ""),
    shell(adb, ["pm", "path", QUALCOMM_PACKAGE]).catch(() => ""),
  ]);
  return /qti|qualcomm|qcom|msm|sdm|\bsm\d/i.test(`${soc} ${hardware} ${board}`) && pkg.includes("package:");
}

export async function stopQualcommTranLog(adb: any, shell: ShellFn) {
  const enabled = (await shell(adb, ["getprop", "persist.sys.tranlogmanager.enable"]).catch(() => "0")).trim();
  if (enabled !== "1") return;
  const main = await openMain(adb, shell);
  const toggle = byResource(main, `${QUALCOMM_PACKAGE}:id/switch_button`);
  if (!toggle) throw new Error("Não foi possível localizar o controle de finalização.");
  if (toggle.getAttribute("checked") === "true" || toggle.getAttribute("text") === "STOP") {
    await tap(adb, shell, toggle);
  }
  await waitLogger(adb, shell, false);
}

async function ensureAllSwitches(adb: any, shell: ShellFn) {
  for (const item of SWITCHES) {
    let doc = await ensureSwitchScreen(adb, shell);
    let checkbox = checkboxFor(doc, item.rowId);
    if (!checkbox) throw new Error(`Não foi possível verificar ${item.label}.`);
    if (checkbox.getAttribute("checked") !== "true") {
      await tap(adb, shell, checkbox);
      await sleep(500);
      doc = await ensureSwitchScreen(adb, shell);
      checkbox = checkboxFor(doc, item.rowId);
      if (!checkbox || checkbox.getAttribute("checked") !== "true") {
        doc = await ensureSwitchScreen(adb, shell);
        checkbox = checkboxFor(doc, item.rowId);
        if (!checkbox) throw new Error(`Não foi possível verificar ${item.label}.`);
        if (checkbox.getAttribute("checked") !== "true") {
          await tap(adb, shell, checkbox);
          await sleep(500);
        }
      }
    }
  }
  const verify = await ensureSwitchScreen(adb, shell);
  const missing = SWITCHES.filter(({ rowId }) => checkboxFor(verify, rowId)?.getAttribute("checked") !== "true");
  if (missing.length) throw new Error("Nem todos os registros técnicos puderam ser ativados.");
}

export async function startQualcommTranLog(adb: any, shell: ShellFn) {
  await keepReady(adb, shell);
  await stopQualcommTranLog(adb, shell);
  await sleep(500);
  await shell(adb, ["find", QUALCOMM_LOG_ROOT, "-type", "f", "-delete"]);
  await ensureAllSwitches(adb, shell);
  await shell(adb, ["input", "keyevent", "4"]);
  await sleep(500);

  const main = await openMain(adb, shell);
  const toggle = byResource(main, `${QUALCOMM_PACKAGE}:id/switch_button`);
  if (!toggle) throw new Error("Não foi possível localizar o controle para iniciar os registros.");
  if (toggle.getAttribute("checked") !== "true" && toggle.getAttribute("text") !== "STOP") {
    await tap(adb, shell, toggle);
  }
  await waitLogger(adb, shell, true);
}

function safeName(path: string) {
  const relative = path.startsWith(`${QUALCOMM_LOG_ROOT}/`)
    ? path.slice(QUALCOMM_LOG_ROOT.length + 1)
    : path;
  return `debuglogger-${relative.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
}

export async function pullQualcommTranLog(
  adb: any,
  shell: ShellFn,
  readRemoteFile: ReadRemoteFileFn,
  onProgress: (current: number, total: number) => void,
) {
  const output = await shell(adb, ["find", QUALCOMM_LOG_ROOT, "-type", "f"]).catch(() => "");
  const paths = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(`${QUALCOMM_LOG_ROOT}/`));
  const files: File[] = [];

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    onProgress(index + 1, paths.length);
    let bytes: Uint8Array | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        bytes = await readRemoteFile(adb, path);
        break;
      } catch (error) {
        lastError = error;
        await sleep(300);
      }
    }
    if (!bytes) {
      throw lastError instanceof Error ? lastError : new Error(`Não foi possível transferir ${path}.`);
    }
    if (bytes.byteLength) {
      files.push(
        new File([bytes], safeName(path), {
          type: path.endsWith(".zip") ? "application/zip" : "application/octet-stream",
        }),
      );
    }
  }
  return files;
}

export async function releaseScreenStayOn(adb: any, shell: ShellFn) {
  await shell(adb, ["svc", "power", "stayon", "false"]).catch(() => "");
}
