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

let tangoPromise: Promise<any> | null = null;
async function loadTango() {
  if (!tangoPromise) {
    // Keep the three Tango packages on the same stable API generation.
    // Mixing newer adb packages with adb-credential-web 2.1.x prevents the
    // browser from completing the RSA authorization handshake on the phone.
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
    request.onerror = () =>
      reject(request.error || new Error("Não foi possível limpar a chave ADB."));
    request.onblocked = () =>
      reject(
        new Error(
          "A chave ADB está em uso por outra aba. Feche outras abas do Aftercare e tente novamente.",
        ),
      );
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
  const [state, setState] = useState<
    "idle" | "connecting" | "connected" | "recording" | "saving" | "done"
  >("idle");
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

  const supported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    "usb" in navigator;

  const updatePhase = (value: string) => {
    phaseRef.current = value;
    setPhase(value);
  };

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(
    () => () => {
      try {
        transportRef.current?.close?.();
      } catch {}
    },
    [],
  );

  async function releaseCurrentConnection() {
    try {
      await transportRef.current?.close?.();
    } catch {}
    adbRef.current = null;
    transportRef.current = null;
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
      if (!manager) {
        throw new Error("Este navegador não oferece acesso USB direto.");
      }

      updatePhase("Selecione seu celular na janela do navegador…");
      const usbDevice = await manager.requestDevice();
      if (!usbDevice) {
        setState("idle");
        updatePhase("");
        return;
      }

      updatePhase("Abrindo a interface USB…");
      rawConnection = await usbDevice.connect();

      const CredentialStore =
        credential.default || credential.AdbWebCredentialStore;
      if (!CredentialStore) {
        throw new Error("ADB_CREDENTIAL_STORE_UNAVAILABLE");
      }
      const credentialStore = new CredentialStore("Aftercare Support");

      const serial =
        usbDevice.serial || usbDevice.raw?.serialNumber || "android";
      updatePhase("Autenticando ADB… verifique a tela do celular");

      // 2.1.x uses AdbDaemonTransport.authenticate + credentialStore.
      // This is the API pair that actually sends the browser RSA public key
      // to Android and triggers the “Permitir depuração USB?” dialog.
      const authenticate = adbModule.AdbDaemonTransport.authenticate({
        serial,
        connection: rawConnection,
        credentialStore,
      });

      const timeout = new Promise<never>((_, reject) => {
        authTimer = window.setTimeout(() => {
          try {
            rawConnection?.close?.();
          } catch {}
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
      const [brand, model, build, android] = await Promise.all([
        shell(adb, ["getprop", "ro.product.brand"]),
        shell(adb, ["getprop", "ro.product.model"]),
        shell(adb, ["getprop", "ro.build.display.id"]),
        shell(adb, ["getprop", "ro.build.version.release"]),
      ]);

      const info = {
        brand: brand.trim(),
        model: model.trim(),
        build: build.trim(),
        android: android.trim(),
        serial,
      };
      setDevice(info);
      onDeviceInfo?.(info);
      updatePhase("");
      setState("connected");
    } catch (e) {
      if (authTimer !== undefined) window.clearTimeout(authTimer);
      try {
        await rawConnection?.close?.();
      } catch {}
      await releaseCurrentConnection();

      const message = e instanceof Error ? e.message : String(e);
      const failedPhase = phaseRef.current;
      setErrorDetail(`${failedPhase || "Conexão"}: ${message}`);
      setError(
        message === "ADB_AUTH_TIMEOUT"
          ? "O celular foi encontrado, mas a autorização ADB não terminou. Refazer a autorização deve gerar uma nova solicitação no celular."
          : /busy|claimInterface|already in use|Access denied|Acesso negado/i.test(
                message,
              )
            ? "A interface USB está ocupada. Feche ADB, Android Studio, scrcpy e outras abas que estejam usando o celular."
            : /NotFound|cancel/i.test(message)
              ? "Nenhum celular foi selecionado."
              : "Não foi possível conectar. Mantenha o celular desbloqueado, confirme a depuração USB e tente novamente.",
      );
      updatePhase("");
      setState("idle");
    }
  }

  async function start() {
    if (!adbRef.current || !device) return;
    setError("");
    setErrorDetail("");
    setSeconds(0);

    try {
      const adb = adbRef.current;
      const id = Date.now().toString(36);
      const video = `/sdcard/aftercare_${id}.mp4`;
      const log = `/sdcard/aftercare_${id}.log.txt`;
      pathsRef.current = { video, log };

      const beforeVideo = parsePids(
        await shell(adb, ["pidof", "screenrecord"]).catch(() => ""),
      );
      const beforeLog = parsePids(
        await shell(adb, ["pidof", "logcat"]).catch(() => ""),
      );
      await shell(adb, ["logcat", "-c"]).catch(() => "");

      processRef.current.video = await adb.subprocess.noneProtocol.spawn([
        "screenrecord",
        "--time-limit",
        "180",
        video,
      ]);
      processRef.current.log = await adb.subprocess.noneProtocol.spawn([
        "logcat",
        "-v",
        "threadtime",
        "-f",
        log,
      ]);
      await sleep(700);

      const afterVideo = parsePids(
        await shell(adb, ["pidof", "screenrecord"]),
      );
      const afterLog = parsePids(await shell(adb, ["pidof", "logcat"]));
      pidsRef.current.video = afterVideo.find(
        (pid) => !beforeVideo.includes(pid),
      );
      pidsRef.current.log = afterLog.find((pid) => !beforeLog.includes(pid));

      if (!pidsRef.current.video) {
        throw new Error("A gravação de tela não iniciou.");
      }
      setState("recording");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível iniciar a coleta.",
      );
      setState("connected");
    }
  }

  async function stop() {
    if (!adbRef.current || !pathsRef.current || !device) return;
    setState("saving");
    setError("");
    setErrorDetail("");

    try {
      const adb = adbRef.current;
      if (pidsRef.current.video) {
        await shell(adb, ["kill", "-2", pidsRef.current.video]).catch(
          () => "",
        );
      }
      if (pidsRef.current.log) {
        await shell(adb, ["kill", "-2", pidsRef.current.log]).catch(
          () => "",
        );
      }
      await sleep(1400);

      const [videoBytes, logBytes] = await Promise.all([
        readRemoteFile(adb, pathsRef.current.video),
        readRemoteFile(adb, pathsRef.current.log).catch(() => new Uint8Array()),
      ]);

      if (videoBytes.byteLength < 1024) {
        throw new Error("A gravação ficou vazia. Tente novamente.");
      }

      const diagnostic = [
        `Brand: ${device.brand}`,
        `Model: ${device.model}`,
        `Android: ${device.android}`,
        `Build: ${device.build}`,
        `Serial: ${device.serial}`,
        `Captured: ${new Date().toISOString()}`,
      ].join("\n");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const files = [
        new File([videoBytes], `aftercare-${stamp}.mp4`, {
          type: "video/mp4",
        }),
        new File([diagnostic], `aftercare-${stamp}-device.txt`, {
          type: "text/plain",
        }),
      ];

      if (logBytes.byteLength) {
        files.push(
          new File([logBytes], `aftercare-${stamp}-log.txt`, {
            type: "text/plain",
          }),
        );
      }
      onFiles(files);

      await shell(adb, [
        "rm",
        "-f",
        pathsRef.current.video,
        pathsRef.current.log,
      ]).catch(() => "");
      setState("done");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível finalizar a coleta.",
      );
      setState("connected");
    } finally {
      pathsRef.current = null;
      pidsRef.current = {};
      processRef.current = {};
    }
  }

  if (!supported) {
    return (
      <div className="usb-collection unsupported">
        <Smartphone size={30} />
        <div>
          <strong>Coleta automática disponível no Chrome ou Edge.</strong>
          <p>
            Abra esta página em um computador usando Chrome ou Microsoft Edge.
            Nenhuma instalação é necessária.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="usb-collection">
      <div className="usb-title">
        <div>
          <span className="eyebrow">COLETA DIRETA PELO NAVEGADOR</span>
          <h3>
            {device ? `${device.brand} ${device.model}` : "Conecte seu celular"}
          </h3>
          <p>
            {device
              ? `Android ${device.android} · ${device.build}`
              : "Use um cabo USB de dados, deixe a tela desbloqueada e mantenha a depuração USB ativada."}
          </p>
        </div>
        {device ? <CheckCircle2 size={28} /> : <Usb size={28} />}
      </div>

      {!device && (
        <>
          <button
            type="button"
            className="primary usb-action"
            disabled={state === "connecting"}
            onClick={connect}
          >
            <Cable size={18} />
            {state === "connecting" ? phase || "Conectando…" : "Conectar celular"}
          </button>
          {error && (
            <button
              type="button"
              className="secondary usb-action"
              disabled={state === "connecting"}
              onClick={resetBrowserAuthorization}
            >
              <RefreshCw size={18} />
              Refazer autorização ADB
            </button>
          )}
        </>
      )}

      {device &&
        state !== "recording" &&
        state !== "saving" &&
        state !== "done" && (
          <>
            <label className="consent usb-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Autorizo a gravação da tela e a coleta de registros técnicos
                somente para analisar este problema.
              </span>
            </label>
            <button
              type="button"
              className="primary usb-action"
              disabled={!consent}
              onClick={start}
            >
              <Play size={18} />
              Iniciar coleta
            </button>
          </>
        )}

      {state === "recording" && (
        <div className="usb-recording">
          <span className="recording-dot" />
          <div>
            <strong>
              Gravação em andamento · {Math.floor(seconds / 60)}:
              {String(seconds % 60).padStart(2, "0")}
            </strong>
            <p>
              Reproduza o problema no celular. Quando terminar, clique no botão
              abaixo.
            </p>
          </div>
          <button type="button" className="danger" onClick={stop}>
            <CircleStop size={18} />
            Terminei
          </button>
        </div>
      )}

      {state === "saving" && (
        <p className="usb-status">
          Salvando a gravação e os registros técnicos…
        </p>
      )}

      {state === "done" && (
        <div className="usb-complete">
          <ShieldCheck size={22} />
          <div>
            <strong>Coleta concluída.</strong>
            <small>
              Os arquivos serão enviados junto com o atendimento na próxima
              etapa.
            </small>
          </div>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {errorDetail && (
        <details className="usb-error-detail">
          <summary>Detalhes técnicos</summary>
          <code>{errorDetail}</code>
        </details>
      )}
    </section>
  );
}
