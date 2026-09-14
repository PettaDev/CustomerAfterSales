export type ShellFn = (adb: any, command: string | string[]) => Promise<string>;
export type ReadRemoteFileFn = (adb: any, path: string) => Promise<Uint8Array>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const remoteImport = (url: string): Promise<any> => import(/* @vite-ignore */ url);

export const MTK_PACKAGE = "com.debug.loggerui";
export const MTK_RECEIVER = `${MTK_PACKAGE}/.framework.LogReceiver`;
export const MTK_ACTION = `${MTK_PACKAGE}.ADB_CMD`;
export const MTK_LOG_ROOT = "/data/debuglogger";

// Required Aftercare profile:
// Mobile 1 + Modem 2 + Network 4 + Connsys 32 = 39.
export const MTK_TARGET = 39;

const STATUS_PROPS = [
  "vendor.MB.running",
  "vendor.mdlogger.Running",
  "vendor.mtklog.netlog.Running",
  "vendor.connsysfw.running",
] as const;

// Some recent Transsion/MediaTek builds expose only vendor.MB.running and leave
// the other status properties blank. Because we delete the old files before
// START, seeing fresh files in all four target trees is a reliable fallback
// verification that target 39 actually started.
const REQUIRED_LOG_DIRS = [
  `${MTK_LOG_ROOT}/mobilelog`,
  `${MTK_LOG_ROOT}/mdlog1`,
  `${MTK_LOG_ROOT}/netlog`,
  `${MTK_LOG_ROOT}/connsyslog`,
] as const;

function isRunningValue(value: string) {
  return /^(1|true|running|on|yes)$/i.test(value.trim());
}

async function status(adb: any, shell: ShellFn) {
  return Promise.all(
    STATUS_PROPS.map((prop) => shell(adb, ["getprop", prop]).catch(() => "")),
  );
}

async function hasFreshRequiredLogs(adb: any, shell: ShellFn) {
  const outputs = await Promise.all(
    REQUIRED_LOG_DIRS.map((dir) => shell(adb, ["find", dir, "-type", "f"]).catch(() => "")),
  );
  return outputs.every((value) => value.trim().length > 0);
}

async function waitLogger(adb: any, shell: ShellFn, running: boolean) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const values = await status(adb, shell);
    const states = values.map(isRunningValue);

    if (running) {
      if (states.every(Boolean) || (await hasFreshRequiredLogs(adb, shell))) return;
    } else if (states.every((value) => !value)) {
      return;
    }

    await sleep(500);
  }

  const values = await status(adb, shell);
  throw new Error(
    running
      ? `Os registros MediaTek não iniciaram corretamente. Status: ${values.join(" | ")}`
      : `Os registros MediaTek não finalizaram corretamente. Status: ${values.join(" | ")}`,
  );
}

async function broadcast(adb: any, shell: ShellFn, command: "start" | "stop", target: number) {
  const output = await shell(adb, [
    "am",
    "broadcast",
    "-a",
    MTK_ACTION,
    "-e",
    "cmd_name",
    command,
    "--ei",
    "cmd_target",
    String(target),
    "-n",
    MTK_RECEIVER,
  ]);

  if (/SecurityException|Permission Denial|Error:/i.test(output)) {
    throw new Error(`DebugLoggerUI recusou o comando ${command}. ${output.trim()}`);
  }
  return output;
}

export async function detectMediaTekDebugLogger(adb: any, shell: ShellFn) {
  const [pkg, soc, hardware, board] = await Promise.all([
    shell(adb, ["pm", "path", MTK_PACKAGE]).catch(() => ""),
    shell(adb, ["getprop", "ro.soc.manufacturer"]).catch(() => ""),
    shell(adb, ["getprop", "ro.hardware"]).catch(() => ""),
    shell(adb, ["getprop", "ro.board.platform"]).catch(() => ""),
  ]);

  if (!pkg.includes("package:")) return false;

  // Package capability is the primary signal. SoC properties are supplemental;
  // Transsion can ship different chipsets under the same brand/model family.
  const platform = `${soc} ${hardware} ${board}`;
  return /mediatek|\bmt\d|\bmtk\b/i.test(platform) || pkg.includes("package:");
}

export async function stopMediaTekDebugLogger(adb: any, shell: ShellFn) {
  await broadcast(adb, shell, "stop", -1).catch(async (error) => {
    const values = await status(adb, shell);
    if (values.some(isRunningValue)) throw error;
  });

  // DebugLogger closes and renames files asynchronously.
  await sleep(4500);
  await waitLogger(adb, shell, false);
}

export async function startMediaTekDebugLogger(adb: any, shell: ShellFn) {
  // Never delete files while a previous logger session may still be writing.
  await stopMediaTekDebugLogger(adb, shell).catch(async () => {
    const values = await status(adb, shell);
    if (values.some(isRunningValue)) {
      throw new Error("Não foi possível parar uma coleta MediaTek anterior.");
    }
  });

  await shell(adb, ["find", MTK_LOG_ROOT, "-type", "f", "-delete"]);
  await broadcast(adb, shell, "start", MTK_TARGET);
  await waitLogger(adb, shell, true);
}

function archiveName(path: string) {
  const relative = path.startsWith(`${MTK_LOG_ROOT}/`)
    ? path.slice(MTK_LOG_ROOT.length + 1)
    : path.replace(/^\/+/, "");
  return `debuglogger/${relative}`;
}

async function createZip(entries: Record<string, Uint8Array>) {
  const { zipSync } = await remoteImport("https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm");
  return zipSync(entries, { level: 6 });
}

export async function pullMediaTekDebugLogger(
  adb: any,
  shell: ShellFn,
  readRemoteFile: ReadRemoteFileFn,
  onProgress: (current: number, total: number) => void,
) {
  const output = await shell(adb, ["find", MTK_LOG_ROOT, "-type", "f"]).catch(() => "");
  const paths = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(`${MTK_LOG_ROOT}/`));

  const entries: Record<string, Uint8Array> = {};
  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    onProgress(index + 1, paths.length);

    let bytes: Uint8Array | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        bytes = await readRemoteFile(adb, path);
        break;
      } catch (error) {
        lastError = error;
        await sleep(500 * (attempt + 1));
      }
    }

    if (!bytes) {
      throw lastError instanceof Error
        ? lastError
        : new Error(`Não foi possível transferir ${path}.`);
    }

    if (bytes.byteLength) entries[archiveName(path)] = bytes;
  }

  if (!Object.keys(entries).length) return [];

  onProgress(paths.length, paths.length);
  const compressed = await createZip(entries);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return [
    new File([compressed], `aftercare-debuglogger-mtk-${stamp}.zip`, {
      type: "application/zip",
    }),
  ];
}
