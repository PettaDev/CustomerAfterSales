import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { portalUi, uiFormat } from "./portal-ui-i18n";

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

function browserMessages(language?: string) {
  if (language?.startsWith("pt")) return {
    indexedDbUnavailable: "O armazenamento de autorização do navegador não está disponível.", resetBlocked: "A autorização está em uso por outra aba. Feche outras abas do Aftercare e tente novamente.", resetFailed: "Não foi possível limpar a autorização do navegador.",
    selectPhone: "Selecione seu celular na janela do navegador…", openingUsb: "Abrindo a conexão USB…", authenticating: "Autenticando… verifique a tela do celular", readingDevice: "Lendo informações do celular…", clearingAuth: "Limpando autorização anterior…",
    directUsbUnavailable: "Este navegador não oferece acesso USB direto.", authStoreUnavailable: "O armazenamento de autorização ADB não está disponível.", authTimeout: "O celular foi encontrado, mas a autorização não terminou. Refazer a autorização deve gerar uma nova solicitação no celular.", usbBusy: "A interface USB está ocupada. Feche ADB, Android Studio, scrcpy e outras abas que estejam usando o celular.", noSelection: "Nenhum celular foi selecionado.", connectFailed: "Não foi possível conectar. Mantenha o celular desbloqueado, confirme a depuração USB e tente novamente.",
    preparingLogs: "Preparando os registros técnicos. Não use o celular por alguns segundos…", preparingMtk: "Preparando os registros técnicos MediaTek. Não use o celular por alguns segundos…", startingRecording: "Iniciando a gravação…", recordingFailed: "A gravação de tela não iniciou.", startFailed: "Não foi possível iniciar a coleta.", finalizingRecording: "Finalizando a gravação…", finalizingLogs: "Finalizando os registros técnicos…", finalizingMtk: "Finalizando os registros técnicos MediaTek…", transferringRecording: "Transferindo a gravação…", transferringLogs: "Transferindo os registros técnicos…", transferringMtk: "Transferindo os registros técnicos MediaTek…", emptyVideo: "A gravação ficou vazia. Tente novamente.", finishFailed: "Não foi possível finalizar toda a coleta. Tente finalizar novamente.", durationError: "A coleta atingiu o limite de 2 minutos e foi encerrada automaticamente. Esta tentativa não será usada. Faça a coleta novamente e finalize assim que o problema acontecer.", sizeError: "A gravação ultrapassou o limite de segurança de 2 GB e foi encerrada. Esta tentativa não será usada. Faça a coleta novamente e finalize em até 2 minutos.",
  };
  if (language?.startsWith("es")) return {
    indexedDbUnavailable: "El almacenamiento de autorización del navegador no está disponible.", resetBlocked: "La autorización está siendo usada por otra pestaña. Cierra otras pestañas de Aftercare e inténtalo nuevamente.", resetFailed: "No fue posible restablecer la autorización del navegador.",
    selectPhone: "Selecciona tu celular en la ventana del navegador…", openingUsb: "Abriendo la conexión USB…", authenticating: "Autenticando… revisa la pantalla del celular", readingDevice: "Leyendo información del dispositivo…", clearingAuth: "Restableciendo la autorización anterior…",
    directUsbUnavailable: "Este navegador no ofrece acceso USB directo.", authStoreUnavailable: "El almacenamiento de autorización ADB no está disponible.", authTimeout: "El celular fue detectado, pero la autorización no terminó. Restablece la autorización para generar una nueva solicitud en el dispositivo.", usbBusy: "La interfaz USB está ocupada. Cierra ADB, Android Studio, scrcpy y otras pestañas que estén usando el dispositivo.", noSelection: "No se seleccionó ningún celular.", connectFailed: "No fue posible conectar. Mantén el celular desbloqueado, confirma la depuración USB e inténtalo nuevamente.",
    preparingLogs: "Preparando los registros técnicos. No uses el celular durante unos segundos…", preparingMtk: "Preparando los registros técnicos MediaTek. No uses el celular durante unos segundos…", startingRecording: "Iniciando la grabación…", recordingFailed: "La grabación de pantalla no se inició.", startFailed: "No fue posible iniciar la recopilación.", finalizingRecording: "Finalizando la grabación…", finalizingLogs: "Finalizando los registros técnicos…", finalizingMtk: "Finalizando los registros técnicos MediaTek…", transferringRecording: "Transfiriendo la grabación…", transferringLogs: "Transfiriendo los registros técnicos…", transferringMtk: "Transfiriendo los registros técnicos MediaTek…", emptyVideo: "La grabación quedó vacía. Inténtalo nuevamente.", finishFailed: "No fue posible finalizar toda la recopilación. Intenta finalizar nuevamente.", durationError: "La recopilación alcanzó el límite de 2 minutos y se detuvo automáticamente. Este intento no se utilizará. Repite la recopilación y finaliza en cuanto ocurra el problema.", sizeError: "La grabación superó el límite de seguridad de 2 GB y se detuvo. Este intento no se utilizará. Repite la recopilación y finaliza en un máximo de 2 minutos.",
  };
  if (language?.startsWith("zh")) return {
    indexedDbUnavailable: "浏览器授权存储不可用。", resetBlocked: "授权正在被其他 Aftercare 标签页使用。请关闭其他标签页后重试。", resetFailed: "无法重置浏览器授权。",
    selectPhone: "请在浏览器窗口中选择您的手机…", openingUsb: "正在打开 USB 连接…", authenticating: "正在授权…请查看手机屏幕", readingDevice: "正在读取设备信息…", clearingAuth: "正在清除之前的授权…",
    directUsbUnavailable: "此浏览器不支持直接 USB 访问。", authStoreUnavailable: "ADB 授权存储不可用。", authTimeout: "已检测到手机，但授权未完成。请重新授权，以便在手机上生成新的确认请求。", usbBusy: "USB 接口正在被占用。请关闭 ADB、Android Studio、scrcpy 以及其他正在使用手机的标签页。", noSelection: "未选择手机。", connectFailed: "无法连接。请保持手机解锁，确认 USB 调试授权后重试。",
    preparingLogs: "正在准备技术日志，请暂时不要操作手机…", preparingMtk: "正在准备 MediaTek 技术日志，请暂时不要操作手机…", startingRecording: "正在开始录制…", recordingFailed: "屏幕录制未启动。", startFailed: "无法开始采集。", finalizingRecording: "正在结束录制…", finalizingLogs: "正在结束技术日志…", finalizingMtk: "正在结束 MediaTek 技术日志…", transferringRecording: "正在传输录制文件…", transferringLogs: "正在传输技术日志…", transferringMtk: "正在传输 MediaTek 技术日志…", emptyVideo: "录制文件为空，请重试。", finishFailed: "无法完成全部采集，请再次尝试结束采集。", durationError: "采集已达到 2 分钟上限并自动停止。本次尝试不会使用。请重新采集，并在问题出现后尽快结束。", sizeError: "录制文件超过 2 GB 安全限制并已停止。本次尝试不会使用。请重新采集并在 2 分钟内结束。",
  };
  return {
    indexedDbUnavailable: "Browser authorization storage is unavailable.", resetBlocked: "Authorization is being used by another tab. Close other Aftercare tabs and try again.", resetFailed: "Could not reset browser authorization.",
    selectPhone: "Select your phone in the browser window…", openingUsb: "Opening the USB connection…", authenticating: "Authorizing… check the phone screen", readingDevice: "Reading device information…", clearingAuth: "Clearing previous authorization…",
    directUsbUnavailable: "This browser does not provide direct USB access.", authStoreUnavailable: "ADB authorization storage is unavailable.", authTimeout: "The phone was found, but authorization did not finish. Reset authorization to generate a new request on the phone.", usbBusy: "The USB interface is busy. Close ADB, Android Studio, scrcpy, and other tabs using the phone.", noSelection: "No phone was selected.", connectFailed: "Could not connect. Keep the phone unlocked, approve USB debugging, and try again.",
    preparingLogs: "Preparing technical logs. Do not use the phone for a few seconds…", preparingMtk: "Preparing MediaTek technical logs. Do not use the phone for a few seconds…", startingRecording: "Starting the recording…", recordingFailed: "Screen recording did not start.", startFailed: "Could not start the collection.", finalizingRecording: "Finalizing the recording…", finalizingLogs: "Finalizing technical logs…", finalizingMtk: "Finalizing MediaTek technical logs…", transferringRecording: "Transferring the recording…", transferringLogs: "Transferring technical logs…", transferringMtk: "Transferring MediaTek technical logs…", emptyVideo: "The recording is empty. Try again.", finishFailed: "Could not finalize the full collection. Try finishing again.", durationError: "The collection reached the 2-minute limit and stopped automatically. This attempt will not be used. Try again and finish as soon as the issue occurs.", sizeError: "The recording exceeded the 2 GB safety limit and stopped. This attempt will not be used. Try again and finish within 2 minutes.",
  };
}

function deleteIndexedDb(name: string, messages: ReturnType<typeof browserMessages>) {
  return new Promise<void>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error(messages.indexedDbUnavailable));
      return;
    }
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error(messages.resetFailed));
    request.onblocked = () => reject(new Error(messages.resetBlocked));
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
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const ui = portalUi(language);
  const messages = browserMessages(language);
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
  const updatePhase = (value: string) => { phaseRef.current = value; setPhase(value); };

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

  useEffect(() => () => { try { transportRef.current?.close?.(); } catch {} }, []);

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
    updatePhase(messages.clearingAuth);
    try {
      await releaseCurrentConnection();
      await deleteIndexedDb(ADB_CREDENTIAL_DB, messages);
      updatePhase("");
      setState("idle");
    } catch (e) {
      setError(messages.resetFailed);
      setErrorDetail(e instanceof Error ? e.message : String(e));
      updatePhase("");
      setState("idle");
    }
  }

  async function connect() {
    setError("");
    setErrorDetail("");
    setState("connecting");
    updatePhase(ui.connecting);
    let rawConnection: any = null;
    let authTimer: number | undefined;
    try {
      await releaseCurrentConnection();
      const { adb: adbModule, webusb, credential } = await loadTango();
      const manager = webusb.AdbDaemonWebUsbDeviceManager?.BROWSER;
      if (!manager) throw new Error(messages.directUsbUnavailable);
      updatePhase(messages.selectPhone);
      const usbDevice = await manager.requestDevice();
      if (!usbDevice) { setState("idle"); updatePhase(""); return; }
      updatePhase(messages.openingUsb);
      rawConnection = await usbDevice.connect();
      const CredentialStore = credential.default || credential.AdbWebCredentialStore;
      if (!CredentialStore) throw new Error(messages.authStoreUnavailable);
      const credentialStore = new CredentialStore("Aftercare Support");
      const serial = usbDevice.serial || usbDevice.raw?.serialNumber || "android";
      updatePhase(messages.authenticating);
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
      updatePhase(messages.readingDevice);
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
      setErrorDetail(`${phaseRef.current || ui.connecting}: ${message}`);
      setError(message === "ADB_AUTH_TIMEOUT"
        ? messages.authTimeout
        : /busy|claimInterface|already in use|Access denied|Acesso negado/i.test(message)
          ? messages.usbBusy
          : /NotFound|cancel/i.test(message)
            ? messages.noSelection
            : messages.connectFailed);
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
        updatePhase(messages.preparingLogs);
        await startQualcommTranLog(adb, shell);
        oemLoggerRef.current = "qualcomm";
        oemStarted = "qualcomm";
      } else if (mediatekCapableRef.current) {
        updatePhase(messages.preparingMtk);
        await startMediaTekDebugLogger(adb, shell);
        oemLoggerRef.current = "mediatek";
        oemStarted = "mediatek";
      }

      updatePhase(messages.startingRecording);
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
      if (!pidsRef.current.video) throw new Error(messages.recordingFailed);
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
      setError(messages.startFailed);
      setErrorDetail(`${phaseRef.current || ui.preparingDiagnosis}: ${e instanceof Error ? e.message : String(e)}`);
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
      updatePhase(messages.finalizingRecording);
      if (pidsRef.current.video) await shell(adb, ["kill", "-2", pidsRef.current.video]).catch(() => "");
      if (pidsRef.current.log) await shell(adb, ["kill", "-2", pidsRef.current.log]).catch(() => "");
      await sleep(1400);

      if (oemLoggerRef.current === "qualcomm") {
        updatePhase(messages.finalizingLogs);
        await stopQualcommTranLog(adb, shell);
        await sleep(4500);
      } else if (oemLoggerRef.current === "mediatek") {
        updatePhase(messages.finalizingMtk);
        await stopMediaTekDebugLogger(adb, shell);
      }

      if (safetyReason) {
        await shell(adb, ["rm", "-f", pathsRef.current.video, pathsRef.current.log]).catch(() => "");
        if (oemLoggerRef.current === "qualcomm") await releaseScreenStayOn(adb, shell);
        updatePhase("");
        setSeconds(0);
        setError(safetyReason === "duration" ? messages.durationError : messages.sizeError);
        setErrorDetail(safetyReason === "duration" ? "120 seconds" : "2 GB");
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
        setError(messages.sizeError);
        setState("connected");
        completed = true;
        return;
      }

      updatePhase(messages.transferringRecording);
      const [videoBytes, logBytes] = await Promise.all([
        readRemoteFile(adb, pathsRef.current.video),
        readRemoteFile(adb, pathsRef.current.log).catch(() => new Uint8Array()),
      ]);
      if (videoBytes.byteLength < 1024) throw new Error(messages.emptyVideo);

      let oemFiles: File[] = [];
      if (oemLoggerRef.current === "qualcomm") {
        updatePhase(messages.transferringLogs);
        oemFiles = await pullQualcommTranLog(adb, shell, readRemoteFile, (current, total) => {
          updatePhase(total ? `${messages.transferringLogs} ${current}/${total}` : messages.transferringLogs);
        });
      } else if (oemLoggerRef.current === "mediatek") {
        updatePhase(messages.transferringMtk);
        oemFiles = await pullMediaTekDebugLogger(adb, shell, readRemoteFile, (current, total) => {
          updatePhase(total ? `${messages.transferringMtk} ${current}/${total}` : messages.transferringMtk);
        });
      }

      const loggerName = oemLoggerRef.current === "qualcomm" ? "TranLogManager" : oemLoggerRef.current === "mediatek" ? "DebugLoggerUI" : "none";
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
      setError(messages.finishFailed);
      setErrorDetail(`${phaseRef.current || ui.savingTechnical}: ${e instanceof Error ? e.message : String(e)}`);
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
    return <div className="usb-collection unsupported"><Smartphone size={30}/><div><strong>{ui.browserAutoAvailable}</strong><p>{ui.browserOpenDesktop}</p></div></div>;
  }

  const remainingSeconds = Math.max(0, MAX_RECORDING_SECONDS - seconds);

  return (
    <section className="usb-collection">
      <div className="usb-title">
        <div>
          <span className="eyebrow">{ui.browserDirect}</span>
          <h3>{device ? `${device.brand} ${device.model}` : ui.connectPhone}</h3>
          <p>{device ? `Android ${device.android} · ${device.build}` : ui.usbHint}</p>
        </div>
        {device ? <CheckCircle2 size={28}/> : <Usb size={28}/>} 
      </div>

      {!device && <>
        <button type="button" className="primary usb-action" disabled={state === "connecting"} onClick={connect}>
          <Cable size={18}/>{state === "connecting" ? phase || ui.connecting : ui.connectPhone}
        </button>
        {error && <button type="button" className="secondary usb-action" disabled={state === "connecting"} onClick={resetBrowserAuthorization}>
          <RefreshCw size={18}/>{ui.redoAuthorization}
        </button>}
      </>}

      {device && state === "connected" && <>
        <div className="hint" role="note"><ShieldCheck size={20}/><p><strong>{ui.maxTwoMinutes}</strong><br/>{ui.twoMinuteHint}</p></div>
        <label className="consent usb-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/><span>{ui.browserConsent}</span></label>
        <button type="button" className="primary usb-action" disabled={!consent} onClick={start}><Play size={18}/>{ui.startCollection}</button>
      </>}

      {state === "preparing" && <p className="usb-status">{phase || ui.preparingDiagnosis}</p>}

      {state === "recording" && <div className="usb-recording">
        <span className="recording-dot"/>
        <div>
          <strong>{ui.recordingInProgress} · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} / 2:00</strong>
          <p>{ui.reproduceFinish}</p>
          {seconds >= RECORDING_WARNING_SECONDS && <p className="error" role="alert" style={{ margin: "8px 0 0" }}>{uiFormat(ui.warningSeconds, { seconds: remainingSeconds })}</p>}
        </div>
        <button type="button" className="danger" onClick={stop}><CircleStop size={18}/>{ui.finished}</button>
      </div>}

      {state === "saving" && <p className="usb-status">{phase || ui.savingTechnical}</p>}
      {state === "done" && <div className="usb-complete"><ShieldCheck size={22}/><div><strong>{ui.collectionComplete}</strong><small>{ui.filesNextStep}</small></div></div>}
      {error && <p className="error" role="alert">{error}</p>}
      {errorDetail && <details className="usb-error-detail"><summary>{ui.technicalDetails}</summary><code>{errorDetail}</code></details>}
    </section>
  );
}
