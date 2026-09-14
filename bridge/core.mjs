import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdir,
  readFile,
  writeFile,
  stat,
  readdir,
  open,
} from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import archiver from "archiver";
const exec = promisify(execFile);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
export function resolvePlatform(p) {
  const f = Object.values(p).join(" ");
  if (/mediatek|\bmtk\b|\bmt\d{4,}\b/i.test(f)) return "MTK";
  if (/sprd|spreadtrum|unisoc|\bums\d+[a-z0-9]*\b|\bsp\d+[a-z0-9]*\b/i.test(f))
    return "SPD";
  return "UNKNOWN";
}
export function parseDevices(out) {
  return out.split(/\r?\n/).flatMap((l) => {
    const m = l.match(/^(\S+)\s+(device|offline|unauthorized)(?:\s|$)/);
    return m ? [{ serial: m[1], state: m[2] }] : [];
  });
}
export const ownedPID = (before, after) => {
  const n = after.filter((p) => !before.includes(p));
  if (n.length !== 1)
    throw Error("Não foi possível identificar a gravação da sessão.");
  return n[0];
};
export const profile = (p) =>
  p === "MTK"
    ? { name: "DebugLogger", remote: "/data/debuglogger" }
    : p === "SPD"
      ? { name: "YLog", remote: "/data/ylog" }
      : null;
export function loggerArgs(action) {
  if (!["start", "stop"].includes(action)) throw Error("Invalid action");
  return [
    "shell",
    "am",
    "broadcast",
    "-a",
    "com.debug.loggerui.ADB_CMD",
    "-e",
    "cmd_name",
    action,
    "--ei",
    "cmd_target",
    "-1",
    "-n",
    "com.debug.loggerui/.framework.LogReceiver",
  ];
}
export async function validateMP4(file) {
  const h = await open(file, "r");
  try {
    const { size } = await h.stat();
    let offset = 0;
    const types = new Set();
    while (offset < size) {
      const b = Buffer.alloc(16);
      const { bytesRead } = await h.read(
        b,
        0,
        Math.min(16, size - offset),
        offset,
      );
      if (bytesRead < 8) return false;
      let n = b.readUInt32BE(0);
      const type = b.toString("ascii", 4, 8);
      let header = 8;
      if (n === 1) {
        if (bytesRead < 16) return false;
        const big = b.readBigUInt64BE(8);
        if (big > BigInt(Number.MAX_SAFE_INTEGER)) return false;
        n = Number(big);
        header = 16;
      }
      if (n === 0) n = size - offset;
      if (n < header || n > size - offset) return false;
      if (n > header && (type !== "ftyp" || n >= 12)) types.add(type);
      offset += n;
    }
    return ["ftyp", "moov", "mdat"].every((t) => types.has(t));
  } finally {
    await h.close();
  }
}
export async function verifyRuntime(root) {
  const manifest = JSON.parse(
    await readFile(new URL("./runtime-manifest.json", import.meta.url)),
  );
  for (const [f, v] of Object.entries(manifest)) {
    const b = await readFile(path.join(root, f));
    if (
      b.length !== v.sizeBytes ||
      createHash("sha256").update(b).digest("hex") !== v.sha256
    )
      throw Error("Componente ausente ou inválido: " + f);
  }
  return true;
}
export class CaptureEngine {
  constructor({
    runtime = process.env.MOBILEQA_RUNTIME,
    root = path.resolve(".local/captures"),
    run,
    launch,
    pause = delay,
  } = {}) {
    this.pause = pause;
    this.runtime = runtime;
    this.root = root;
    this.sessions = new Map();
    this.busy = new Set();
    this.run =
      run ||
      ((args, timeout = 20000) =>
        exec(path.join(runtime, "SCRCPY/adb.exe"), args, {
          timeout,
          maxBuffer: 8 * 1024 * 1024,
          windowsHide: true,
        }).then((x) => x.stdout));
    this.launch =
      launch ||
      ((args) =>
        spawn(path.join(runtime, "SCRCPY/adb.exe"), args, {
          windowsHide: true,
          stdio: "ignore",
        }));
  }
  async check() {
    if (!this.runtime)
      throw Error("Configure MOBILEQA_RUNTIME com a pasta da MobileQA RC3.");
    await verifyRuntime(this.runtime);
  }
  async devices() {
    return parseDevices(await this.run(["devices"], 8000));
  }
  async adb(serial, args, timeout) {
    if (!/^[a-zA-Z0-9._:-]+$/.test(serial)) throw Error("Serial inválido.");
    return this.run(["-s", serial, ...args], timeout);
  }
  async device(serial) {
    if (
      !(await this.devices()).some(
        (d) => d.serial === serial && d.state === "device",
      )
    )
      throw Error("Desbloqueie o aparelho e autorize a depuração USB.");
    const raw = await this.adb(serial, ["shell", "getprop"]);
    const props = Object.fromEntries(
      raw.split(/\r?\n/).flatMap((l) => {
        const m = l.match(/^\[([^\]]+)\]: \[(.*)\]$/);
        return m ? [[m[1], m[2]]] : [];
      }),
    );
    const keys = [
      "ro.board.platform",
      "ro.hardware",
      "ro.boot.hardware",
      "ro.soc.manufacturer",
      "ro.soc.model",
      "ro.mediatek.platform",
      "ro.vendor.mediatek.platform",
      "ro.boot.hardware.platform",
    ];
    return {
      serial,
      brand:
        props["ro.product.brand"] || props["ro.product.vendor.brand"] || "",
      model: props["ro.product.model"] || "",
      build: props["ro.build.display.id"] || "",
      android: props["ro.build.version.release"] || "",
      platform: resolvePlatform(
        Object.fromEntries(keys.map((k) => [k, props[k] || ""])),
      ),
    };
  }
  async pids(serial) {
    try {
      return (await this.adb(serial, ["shell", "pidof", "screenrecord"], 5000))
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    } catch (e) {
      if (e.code === 1 && !e.stderr) return [];
      throw e;
    }
  }
  async persist(s) {
    await mkdir(path.join(this.root, s.id), { recursive: true });
    await writeFile(
      path.join(this.root, s.id, "metadata.json"),
      JSON.stringify(s, null, 2),
    );
  }
  async start(serial, ylogStarted) {
    if (this.busy.has(serial))
      throw Error("Já existe uma sessão ativa neste aparelho.");
    this.busy.add(serial);
    let s;
    try {
      const device = await this.device(serial);
      if (!profile(device.platform))
        throw Error("Plataforma sem suporte. Use a coleta guiada.");
      if (device.platform === "SPD" && !ylogStarted)
        throw Error("Inicie os logs no YLog e confirme antes da gravação.");
      const before = await this.pids(serial);
      if (before.length)
        throw Error("Já existe uma gravação ativa no aparelho.");
      s = {
        id: randomUUID(),
        device,
        status: "starting",
        startedAt: new Date().toISOString(),
      };
      s.remoteVideo = "/sdcard/aftersales_" + s.id + ".mp4";
      this.sessions.set(s.id, s);
      await this.persist(s);
      if (device.platform === "MTK") {
        await this.adb(serial, loggerArgs("start"));
        s.loggerStarted = true;
      }
      const proc = this.launch([
        "-s",
        serial,
        "shell",
        "screenrecord",
        s.remoteVideo,
      ]);
      proc.once("error", (e) => {
        s.processError = e.message;
      });
      await this.pause(800);
      if (s.processError) throw Error(s.processError);
      s.pid = ownedPID(before, await this.pids(serial));
      const identity = await this.adb(serial, [
        "shell",
        "cat",
        `/proc/${s.pid}/cmdline`,
      ]);
      if (!identity.includes(s.remoteVideo))
        throw Error("Identidade da gravação inválida.");
      s.status = "recording";
      await this.persist(s);
      return s;
    } catch (e) {
      if (s) {
        s.reason = e.message;
        s.status = "failed";
        await this.cleanup(s);
        await this.persist(s);
        await this.package(s).catch(() => {});
      }
      this.busy.delete(serial);
      throw e;
    }
  }
  async stopVideo(s) {
    const serial = s.device.serial;
    if (!/^\d+$/.test(s.pid || "")) throw Error("PID da sessão ausente.");
    let cmd;
    try {
      cmd = await this.adb(
        serial,
        ["shell", "cat", `/proc/${s.pid}/cmdline`],
        5000,
      );
    } catch {
      s.reason = "Gravação terminou antes da parada solicitada.";
      return;
    }
    if (!cmd.includes("screenrecord") || !cmd.includes(s.remoteVideo))
      throw Error(
        "PID pertence a outro processo. Nenhum processo foi encerrado.",
      );
    await this.adb(serial, ["shell", "kill", "-2", s.pid], 5000);
    for (let i = 0; i < 20; i++) {
      await this.pause(500);
      if (!(await this.pids(serial)).includes(s.pid)) return;
    }
    throw Error("A gravação não finalizou. Vídeo preservado.");
  }
  async cleanup(s) {
    if (s.pid) await this.stopVideo(s).catch(() => {});
    if (s.loggerStarted)
      await this.adb(s.device.serial, loggerArgs("stop")).catch(() => {});
  }
  async stop(id, ylogStopped = false) {
    const s = this.sessions.get(id);
    if (!s) throw Error("Sessão não encontrada.");
    if (!["recording", "awaiting_ylog_stop", "interrupted"].includes(s.status))
      throw Error("Sessão não está pronta para finalizar.");
    const prev = s.status;
    s.status = "finalizing";
    try {
      if (prev !== "awaiting_ylog_stop") await this.stopVideo(s);
      if (s.device.platform === "SPD" && !ylogStopped) {
        s.status = "awaiting_ylog_stop";
        await this.persist(s);
        return s;
      }
      if (s.device.platform === "MTK")
        await this.adb(s.device.serial, loggerArgs("stop"));
      await this.pause(4000);
      const serial = s.device.serial;
      const size = async () =>
        Number(
          (
            await this.adb(
              serial,
              ["shell", "stat", "-c", "%s", s.remoteVideo],
              8000,
            )
          ).trim(),
        );
      const a = await size();
      await this.pause(1000);
      if (a <= 0 || a !== (await size()))
        throw Error("Vídeo vazio ou ainda sendo gravado.");
      const dest = path.join(this.root, s.id, "video.mp4");
      await this.adb(serial, ["pull", s.remoteVideo, dest], 120000);
      if ((await stat(dest)).size !== a || !(await validateMP4(dest)))
        throw Error("Vídeo incompleto; cópia remota preservada.");
      s.videoValidated = true;
      const digest = createHash("sha256");
      for await (const chunk of createReadStream(dest)) digest.update(chunk);
      s.videoSha256 = digest.digest("hex");
      await this.adb(serial, ["shell", "rm", "-f", s.remoteVideo]);
      const p = profile(s.device.platform);
      const dir = path.join(this.root, s.id, p.name);
      let err;
      for (let i = 0; i < 3; i++) {
        try {
          await this.adb(serial, ["pull", p.remote, dir], 300000);
          err = null;
          break;
        } catch (e) {
          err = e;
          if (
            !/No such file|remote open failed/i.test(
              String(e.stderr || e.message),
            )
          )
            break;
          await this.pause(2000 * (i + 1));
        }
      }
      let files = [];
      try {
        files = await readdir(dir, { recursive: true, withFileTypes: true });
      } catch {}
      if (!files.some((f) => f.isFile()))
        throw Error("Nenhum arquivo de log foi recebido.");
      if (err)
        s.reason =
          "Coleta de logs parcial: arquivos mudaram durante a transferência.";
      s.status = s.reason ? "partial" : "complete";
    } catch (e) {
      s.status = s.videoValidated ? "partial" : "failed";
      s.reason = e.message;
      await this.cleanup(s);
      await writeFile(
        path.join(this.root, s.id, "failure.json"),
        JSON.stringify(
          {
            reason: e.message,
            remoteVideo: s.remoteVideo,
            remoteVideoPreserved: !s.videoValidated,
          },
          null,
          2,
        ),
      );
    } finally {
      if (s.status !== "awaiting_ylog_stop") {
        s.endedAt = new Date().toISOString();
        this.busy.delete(s.device.serial);
        await this.persist(s);
        await this.package(s);
      } else await this.persist(s);
    }
    return s;
  }
  async package(s) {
    const file = path.join(this.root, s.id + ".zip");
    await new Promise((resolve, reject) => {
      const out = createWriteStream(file),
        zip = archiver("zip", { zlib: { level: 6 } });
      out.on("close", resolve);
      out.on("error", reject);
      zip.on("error", reject);
      zip.pipe(out);
      zip.directory(path.join(this.root, s.id), false);
      zip.finalize();
    });
    s.packagePath = file;
    await this.persist(s);
  }
  async monitor() {
    for (const s of this.sessions.values()) {
      if (s.status !== "recording") continue;
      try {
        const d = await this.devices();
        if (
          !d.some(
            (x) => x.serial === s.device.serial && x.state === "device",
          ) ||
          !(await this.pids(s.device.serial)).includes(s.pid)
        ) {
          s.reason = "Conexão perdida ou gravação interrompida.";
          s.status = "interrupted";
          await this.persist(s);
          await this.stop(s.id);
        }
      } catch {
        s.reason = "Não foi possível verificar a conexão.";
        s.status = "interrupted";
        await this.persist(s);
        await this.stop(s.id);
      }
    }
  }
  async restore() {
    await mkdir(this.root, { recursive: true });
    for (const item of await readdir(this.root, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      try {
        const s = JSON.parse(
          await readFile(
            path.join(this.root, item.name, "metadata.json"),
            "utf8",
          ),
        );
        if (!["complete", "partial", "failed"].includes(s.status)) {
          s.status = "interrupted";
          s.reason = "Bridge reiniciado. Reconecte o aparelho para finalizar.";
          this.busy.add(s.device.serial);
        }
        this.sessions.set(s.id, s);
      } catch {}
    }
  }
  mirror(serial) {
    if (!this.runtime) throw Error("Runtime ausente.");
    if (!/^[a-zA-Z0-9._:-]+$/.test(serial)) throw Error("Serial inválido.");
    const p = spawn(
      path.join(this.runtime, "SCRCPY/scrcpy.exe"),
      [
        "--serial",
        serial,
        "--no-audio",
        "--window-title",
        "Visualização do seu celular",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    p.on("error", () => {});
    return p;
  }
}
