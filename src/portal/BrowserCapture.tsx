import { useEffect, useRef, useState } from "react";
import {
  Cable,
  CheckCircle2,
  CircleStop,
  Play,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Usb,
} from "lucide-react";
import {
  detectQualcommTranLog,
  pullQualcommTranLog,
  releaseScreenStayOn,
  startQualcommTranLog,
  stopQualcommTranLog,
} from "./qualcomm-tranlog";
import {
  detectMediaTekDebugLogger,
  pullMediaTekDebugLogger,
  startMediaTekDebugLogger,
  stopMediaTekDebugLogger,
} from "./mediatek-debuglogger";

type DeviceInfo = {
  brand: string;
  model: string;
  build: string;
  android: string;
  serial: string;
};

type Props = {
  onFiles: (files: File[]) => void;
  onDeviceInfo?: (info: DeviceInfo) => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const remoteImport = (url: string): Promise<any> => import(/* @vite-ignore */ url);
const AUTH_TIMEOUT_MS = 20000;
const ADB_CREDENTIAL_DB = "Tango";
const MAX_RECORDING_SECONDS = 120;
const RECORDING_WARNING_SECONDS = 90;
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

let tangoPromise: Promise<any> | null = null;
async function loadTango() {
  if (!tangoPromise) {
    tangoPromise = Promise.all([
      remoteImport("https://cdn.jsdelivr.net/npm/@yume-chan/adb@2.1.0/+esm"),
      remoteImport("https://cdn.jsdelivr.net/npm/@yume-chan/adb-daemon-webusb@2.1.0/+esm"),
      remoteImport("https://cdn.jsdelivr.net/npm/@yume-chan/adb-credential-web@2.1.0/+esm"),
    ]).then(([adb, webusb, credential]) => ({ adb, webusb, credential }));
  }
  return tangoPromise;
}

function deleteIndexedDb(name: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB não está disponível neste navegador."));
      return;
    }
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Não foi possível limpar a chave ADB."));
    request.onblocked = () => reject(new Error("A chave ADB está em uso por outra aba. Feche outras abas do Aftercare e tente novamente."));
  });
}

async function shell(adb: any, command: string | string[]) {
  const service = adb.subprocess.shellProtocol || adb.subprocess.noneProtocol;
  if (typeof service.spawnWaitText === "function") {
    const result = await service.spawnWaitText(command);
    return typeof result === "string" ? result : result.stdout;
  }
  return service.spawn(command).wait().toString();
}

function parsePids(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

async function remoteFileSize(adb: any, path: string) {
  const result = await shell(adb, ["stat", "-c", "%s", path]).catch(() => "");
  const value = Number(result.trim().split(/\s+/)[0]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

async function readRemoteFile(adb: any, path: string) {
  const sync = typeof adb.sync === "function" ? await adb.sync() : adb.sync;
  try {
    const reader = sync.read(path).getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    const joined = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      joined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return joined;
  } finally {
    if (typeof sync.dispose === "function") await sync.dispose();
  }
}

export default function BrowserCapture({ onFiles, onDeviceInfo }: Props) {
  const [state, setState] = useState<"idle" | "connecting" | "connected" | "preparing" | "recording" | "saving" | "done">("idle");
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [phase, setPhase] = useState("");
  const [seconds, setSeconds] = useState(0);
  const adbRef = useRef<any>(null);
  const transportRef = useRef<any>(null);
  const phaseRef = useRef("");
  const processRef = useRef<{ video?: any; log?: any }>({});
  const pathsRef = useRef<{ video: string; log: string } | null>(null);
  const pidsRef = useRef<{ video?: string; log?: string }>({});
  const oemLoggerRef = useRef<"qualcomm" | "mediatek" | null>(null);
  const qualcommCapableRef = useRef(false);
  const mediatekCapableRef = useRef(false);
  const safetyStopReasonRef = useRef<"duration" | "size" | null>(null);
  const stopInProgressRef = useRef(false);

  const supported = typeof window !== "undefined" && window.isSecureContext && typeof navigator !== "undefined" && "usb" in navigator;

  const updatePhase = (value: string) => {
    phaseRef.current = value;
    setPhase(value);
  };

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(value + 1, MAX_RECORDING_SECONDS)), 1000);
    const timeout = window.setTimeout(() => {
      safetyStopReasonRef.current = "duration";
      void stop();
    }, MAX_RECORDING_SECONDS * 1000);
    const sizeTimer = window.setInterval(() => {
      if (!adbRef.current || !pathsRef.current || stopInProgressRef.current) return;
      void remoteFileSize(adbRef.current, pathsRef.current.video).then((size) => {
        if (size > MAX_VIDEO_BYTES && !stopInProgressRef.current) {
          safetyStopReasonRef.current = "size";
          void stop();
        }
      });
    }, 5000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      window.clearInterval(sizeTimer);
    };
  }, [state]);

  useEffect(() => () => {
    try { transportRef.current?.close?.(); } catch {}
  }, []);

  async function releaseCurrentConnection() {
    try { await transportRef.current?.close?.(); } catch {}
    adbRef.current = null;
    transportRef.current = null;
    oemLoggerRef.current = null;
    qualcommCapableRef.current = false;
    mediatekCapableRef.current = false;
    setDevice(null);
  }

  async function resetBrowserAuthorization() {
    setError("");
    setErrorDetail("");
    updatePhase("Limpando autorização anterior…");
    try {
      await releaseCurrentConnection();
      await deleteIndexedDb(ADB_CREDENTIAL_DB);
      updatePhase("");
      setState("idle");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError("Não foi possível limpar a autorização do navegador.");
      setErrorDetail(message);
      updatePhase("");
      setState("idle");
    }
  }

  async function connect() {
    setError("");
    setErrorDetail("");
    setState("connecting");
    updatePhase("Preparando conexão USB…");
    let rawConnection: any = null;
    let authTimer: number | undefined;
    try {
      await releaseCurrentConnection();
      const { adb: adbModule, webusb, credential } = await loadTango();
      const manager = webusb.AdbDaemonWebUsbDeviceManager?.BROWSER;
      if (!manager) throw new Error("Este navegador não oferece acesso USB direto.");
      updatePhase("Selecione seu celular na janela do navegador…");
      const usbDevice = await manager.requestDevice();
      if (!usbDevice) { setState("idle"); updatePhase(""); return; }
      updatePhase("Abrindo a interface USB…");
      rawConnection = await usbDevice.connect();
      const CredentialStore = credential.default || credential.AdbWebCredentialStore;
      if (!CredentialStore) throw new Error("ADB_CREDENTIAL_STORE_UNAVAILABLE");
      const credentialStore = new CredentialStore("Aftercare Support");
      const serial = usbDevice.serial || usbDevice.raw?.serialNumber || "android";
      updatePhase("Autenticando ADB… verifique a tela do celular");
      const authenticate = adbModule.AdbDaemonTransport.authenticate({ serial, connection: rawConnection, credentialStore });
      const timeout = new Promise<never>((_, reject) => {
        authTimer = window.setTimeout(() => {
          try { rawConnection?.close?.(); } catch {}
          reject(new Error("ADB_AUTH_TIMEOUT"));
        }, AUTH_TIMEOUT_MS);
      });
      const transport = await Promise.race([authenticate, timeout]);
      if (authTimer !== undefined) window.clearTimeout(authTimer);
      const adb = new adbModule.Adb(transport);
      adbRef.current = adb;
      transportRef.current = transport;
      rawConnection = null;
      updatePhase("Lendo informações do celular…");
      const [brand, model, build, android, qualcommCapable, mediatekCapable] = await Promise.all([
        shell(adb, ["getprop", "ro.product.brand"]),
        shell(adb, ["getprop", "ro.product.model"]),
        shell(adb, ["getprop", "ro.build.display.id"]),
        shell(adb, ["getprop", "ro.build.version.release"]),
        detectQualcommTranLog(adb, shell),
        detectMediaTekDebugLogger(adb, shell),
      ]);
      qualcommCapableRef.current = qualcommCapable;
      mediatekCapableRef.current = mediatekCapable && !qualcommCapable;
      const info = { brand: brand.trim(), model: model.trim(), build: build.trim(), android: android.trim(), serial };
      setDevice(info);
      onDeviceInfo?.(info);
      updatePhase("");
      setState("connected");
    } catch (e) {
      if (authTimer !== undefined) window.clearTimeout(authTimer);
      try { await rawConnection?.close?.(); } catch {}
      await releaseCurrentConnection();
      const message = e instanceof Error ? e.message : String(e);
      const failedPhase = phaseRef.current;
      setErrorDetail(`${failedPhase || "Conexão"}: ${message}`);
      setError(message === "ADB_AUTH_TIMEOUT"
        ? "O celular foi encontrado, mas a autorização ADB não terminou. Refazer a autorização deve gerar uma nova solicitação no celular."
        : /busy|claimInterface|already in use|Access denied|Acesso negado/i.test(message)
          ? "A interface USB está ocupada. Feche ADB, Android Studio, scrcpy e outras abas que estejam usando o celular."
          : /NotFound|cancel/i.test(message)
            ? "Nenhum celular foi selecionado."
            : "Não foi possível conectar. Mantenha o celular desbloqueado, confirme a depuração USB e tente novamente.");
      updatePhase("");
      setState("idle");
    }
  }

  async function start() {
    if (!adbRef.current || !device) return;
    setError("");
    setErrorDetail("");
    setSeconds(0);
    safetyStopReasonRef.current = null;
    setState("preparing");
    let oemStarted: "qualcomm" | "mediatek" | null = null;
    try {
      const adb = adbRef.current;
      if (qualcommCapableRef.current) {
        updatePhase("Preparando os registros técnicos. Não use o celular por alguns segundos…");
        await startQualcommTranLog(adb, shell);
        oemLoggerRef.current = "qualcomm";
        oemStarted = "qualcomm";
      } else if (mediatekCapableRef.current) {
        updatePhase("Preparando os registros técnicos MediaTek. Não use o celular por alguns segundos…");
        await startMediaTekDebugLogger(adb, shell);
        oemLoggerRef.current = "mediatek";
        oemStarted = "mediatek";
      }

      updatePhase("Iniciando a gravação…");
      const id = Date.now().toString(36);
      const video = `/sdcard/aftercare_${id}.mp4`;
      const log = `/sdcard/aftercare_${id}.log.txt`;
      pathsRef.current = { video, log };
      const beforeVideo = parsePids(await shell(adb, ["pidof", "screenrecord"]).catch(() => ""));
      const beforeLog = parsePids(await shell(adb, ["pidof", "logcat"]).catch(() => ""));
      await shell(adb, ["logcat", "-c"]).catch(() => "");
      processRef.current.video = await adb.subprocess.noneProtocol.spawn(["screenrecord", "--time-limit", String(MAX_RECORDING_SECONDS), video]);
      processRef.current.log = await adb.subprocess.noneProtocol.spawn(["logcat", "-v", "threadtime", "-f", log]);
      await sleep(700);
      const afterVideo = parsePids(await shell(adb, ["pidof", "screenrecord"]));
      const afterLog = parsePids(await shell(adb, ["pidof", "logcat"]));
      pidsRef.current.video = afterVideo.find((pid) => !beforeVideo.includes(pid));
      pidsRef.current.log = afterLog.find((pid) => !beforeLog.includes(pid));
      if (!pidsRef.current.video) throw new Error("A gravação de tela não iniciou.");
      if (qualcommCapableRef.current) await shell(adb, ["input", "keyevent", "3"]).catch(() => "");
      updatePhase("");
      setState("recording");
    } catch (e) {
      if (oemStarted === "qualcomm") {
        await stopQualcommTranLog(adbRef.current, shell).catch(() => "");
        await releaseScreenStayOn(adbRef.current, shell);
      } else if (oemStarted === "mediatek") {
        await stopMediaTekDebugLogger(adbRef.current, shell).catch(() => "");
      }
      oemLoggerRef.current = null;
      setError(e instanceof Error ? e.message : "Não foi possível iniciar a coleta.");
      setErrorDetail(`${phaseRef.current || "Preparação"}: ${e instanceof Error ? e.message : String(e)}`);
      updatePhase("");
      setState("connected");
    }
  }

  async function stop() {
    if (!adbRef.current || !pathsRef.current || !device || stopInProgressRef.current) return;
    stopInProgressRef.current = true;
    setState("saving");
    setError("");
    setErrorDetail("");
    const safetyReason = safetyStopReasonRef.current;
    let completed = false;
    try {
      const adb = adbRef.current;
      updatePhase("Finalizando a gravação…");
      if (pidsRef.current.video) await shell(adb, ["kill", "-2", pidsRef.current.video]).catch(() => "");
      if (pidsRef.current.log) await shell(adb, ["kill", "-2", pidsRef.current.log]).catch(() => "");
      await sleep(1400);

      if (oemLoggerRef.current === "qualcomm") {
        updatePhase("Finalizando os registros técnicos…");
        await stopQualcommTranLog(adb, shell);
        await sleep(4500);
      } else if (oemLoggerRef.current === "mediatek") {
        updatePhase("Finalizando os registros técnicos MediaTek…");
        await stopMediaTekDebugLogger(adb, shell);
      }

      if (safetyReason) {
        await shell(adb, ["rm", "-f", pathsRef.current.video, pathsRef.current.log]).catch(() => "");
        if (oemLoggerRef.current === "qualcomm") await releaseScreenStayOn(adb, shell);
        updatePhase("");
        setSeconds(0);
        setError(safetyReason === "duration"
          ? "A coleta atingiu o limite de 2 minutos e foi encerrada automaticamente. Esta tentativa não será usada. Faça a coleta novamente e finalize assim que o problema acontecer."
          : "A gravação ultrapassou o limite de segurança de 2 GB e foi encerrada. Esta tentativa não será usada. Faça a coleta novamente e finalize em até 2 minutos.");
        setErrorDetail(safetyReason === "duration" ? "Limite de duração atingido: 120 segundos." : "Limite de tamanho do vídeo atingido: 2 GB.");
        setState("connected");
        completed = true;
        return;
      }

      const videoSize = await remoteFileSize(adb, pathsRef.current.video);
      if (videoSize > MAX_VIDEO_BYTES) {
        safetyStopReasonRef.current = "size";
        await shell(adb, ["rm", "-f", pathsRef.current.video, pathsRef.current.log]).catch(() => "");
        if (oemLoggerRef.current === "qualcomm") await releaseScreenStayOn(adb, shell);
        updatePhase("");
        setError("A gravação ultrapassou o limite de segurança de 2 GB e foi descartada. Faça a coleta novamente e finalize em até 2 minutos.");
        setState("connected");
        completed = true;
        return;
      }

      updatePhase("Transferindo a gravação…");
      const [videoBytes, logBytes] = await Promise.all([
        readRemoteFile(adb, pathsRef.current.video),
        readRemoteFile(adb, pathsRef.current.log).catch(() => new Uint8Array()),
      ]);
      if (videoBytes.byteLength < 1024) throw new Error("A gravação ficou vazia. Tente novamente.");

      let oemFiles: File[] = [];
      if (oemLoggerRef.current === "qualcomm") {
        updatePhase("Transferindo os registros técnicos…");
        oemFiles = await pullQualcommTranLog(adb, shell, readRemoteFile, (current, total) => {
          updatePhase(total ? `Transferindo registros técnicos… ${current}/${total}` : "Transferindo registros técnicos…");
        });
      } else if (oemLoggerRef.current === "mediatek") {
        updatePhase("Transferindo os registros técnicos MediaTek…");
        oemFiles = await pullMediaTekDebugLogger(adb, shell, readRemoteFile, (current, total) => {
          updatePhase(total ? `Transferindo registros MediaTek… ${current}/${total}` : "Transferindo registros MediaTek…");
        });
      }

      const loggerName = oemLoggerRef.current === "qualcomm"
        ? "TranLogManager"
        : oemLoggerRef.current === "mediatek"
          ? "DebugLoggerUI"
          : "none";
      const diagnostic = [
        `Brand: ${device.brand}`,
        `Model: ${device.model}`,
        `Android: ${device.android}`,
        `Build: ${device.build}`,
        `Serial: ${device.serial}`,
        `OEM logger: ${loggerName}`,
        `OEM files: ${oemFiles.length}`,
        `Captured: ${new Date().toISOString()}`,
      ].join("\n");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const files = [
        new File([videoBytes], `aftercare-${stamp}.mp4`, { type: "video/mp4" }),
        new File([diagnostic], `aftercare-${stamp}-device.txt`, { type: "text/plain" }),
        ...oemFiles,
      ];
      if (logBytes.byteLength) files.push(new File([logBytes], `aftercare-${stamp}-log.txt`, { type: "text/plain" }));
      onFiles(files);
      await shell(adb, ["rm", "-f", pathsRef.current.video, pathsRef.current.log]).catch(() => "");
      if (oemLoggerRef.current === "qualcomm") await releaseScreenStayOn(adb, shell);
      updatePhase("");
      setState("done");
      completed = true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError("Não foi possível finalizar toda a coleta. Tente finalizar novamente.");
      setErrorDetail(`${phaseRef.current || "Finalização"}: ${message}`);
      updatePhase("");
      setState("recording");
    } finally {
      stopInProgressRef.current = false;
      if (completed) {
        pathsRef.current = null;
        pidsRef.current = {};
        processRef.current = {};
        oemLoggerRef.current = null;
        safetyStopReasonRef.current = null;
      }
    }
  }

  if (!supported) {
    return <div className="usb-collection unsupported"><Smartphone size={30}/><div><strong>Coleta automática disponível no Chrome ou Edge.</strong><p>Abra esta página em um computador usando Chrome ou Microsoft Edge. Nenhuma instalação é necessária.</p></div></div>;
  }

  const remainingSeconds = Math.max(0, MAX_RECORDING_SECONDS - seconds);

  return (
    <section className="usb-collection">
      <div className="usb-title"><div><span className="eyebrow">COLETA DIRETA PELO NAVEGADOR</span><h3>{device ? `${device.brand} ${device.model}` : "Conecte seu celular"}</h3><p>{device ? `Android ${device.android} · ${device.build}` : "Use um cabo USB de dados, deixe a tela desbloqueada e mantenha a depuração USB ativada."}</p></div>{device ? <CheckCircle2 size={28}/> : <Usb size={28}/>}</div>

      {!device && <><button type="button" className="primary usb-action" disabled={state === "connecting"} onClick={connect}><Cable size={18}/>{state === "connecting" ? phase || "Conectando…" : "Conectar celular"}</button>{error && <button type="button" className="secondary usb-action" disabled={state === "connecting"} onClick={resetBrowserAuthorization}><RefreshCw size={18}/>Refazer autorização ADB</button>}</>}

      {device && state === "connected" && <><div className="hint" role="note"><ShieldCheck size={20}/><p><strong>Limite máximo: 2 minutos.</strong><br/>Depois de iniciar, reproduza o problema imediatamente e finalize assim que ele acontecer. Ao atingir 2 minutos, a coleta será encerrada automaticamente e será necessário fazer uma nova tentativa.</p></div><label className="consent usb-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/><span>Autorizo a gravação da tela e a coleta de registros técnicos somente para analisar este problema.</span></label><button type="button" className="primary usb-action" disabled={!consent} onClick={start}><Play size={18}/>Iniciar coleta</button></>}

      {state === "preparing" && <p className="usb-status">{phase || "Preparando o diagnóstico. Não use o celular por alguns segundos…"}</p>}

      {state === "recording" && <div className="usb-recording"><span className="recording-dot"/><div><strong>Gravação em andamento · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} / 2:00</strong><p>Reproduza o problema no celular. Quando acontecer, volte a esta página e clique em “Terminei”.</p>{seconds >= RECORDING_WARNING_SECONDS && <p className="error" role="alert" style={{ margin: "8px 0 0" }}>Atenção: faltam {remainingSeconds} segundo{remainingSeconds === 1 ? "" : "s"}. A coleta será encerrada automaticamente em 2 minutos.</p>}</div><button type="button" className="danger" onClick={stop}><CircleStop size={18}/>Terminei</button></div>}

      {state === "saving" && <p className="usb-status">{phase || "Salvando a gravação e os registros técnicos…"}</p>}
      {state === "done" && <div className="usb-complete"><ShieldCheck size={22}/><div><strong>Coleta concluída.</strong><small>Os arquivos serão enviados junto com o atendimento na próxima etapa.</small></div></div>}
      {error && <p className="error" role="alert">{error}</p>}
      {errorDetail && <details className="usb-error-detail"><summary>Detalhes técnicos</summary><code>{errorDetail}</code></details>}
    </section>
  );
}
