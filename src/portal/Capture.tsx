import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Monitor,
  Smartphone,
  Cable,
  Play,
  Square,
  UploadCloud,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  portalDateLocale,
  portalStatus,
  portalUi,
  uiFormat,
} from "./portal-ui-i18n";

export default function Capture() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const ui = portalUi(language);
  const locale = portalDateLocale(language);
  const [key, setKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [device, setDevice] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ylog, setYlog] = useState(false);
  const [consent, setConsent] = useState(false);
  const [auto, setAuto] = useState(true);
  const [caseId, setCaseId] = useState("");
  const [token, setToken] = useState("");
  const uploading = useRef(new Set<string>());
  const autoRef = useRef(false);
  autoRef.current = auto;

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem("case-access") || "null");
      if (c) {
        setCaseId(c.id);
        setToken(c.token);
      }
    } catch {}
  }, []);

  async function bridge(route: string, data?: unknown) {
    const r = await fetch("http://127.0.0.1:43127" + route, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        Authorization: "Bearer " + key,
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      signal: AbortSignal.timeout(
        route.includes("/stop") || route.includes("/upload") ? 1200000 : 10000,
      ),
    });
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    return b;
  }

  async function refresh() {
    const [d, s] = await Promise.all([bridge("/devices"), bridge("/sessions")]);
    setDevices(d.devices);
    setSessions(s.sessions);
    if (d.devices.length === 1 && d.devices[0].state === "device" && !device) {
      setDevice(await bridge("/devices/" + d.devices[0].serial));
    }
    return s.sessions;
  }

  async function send(s: any) {
    if (uploading.current.has(s.id)) return;
    uploading.current.add(s.id);
    try {
      await bridge("/sessions/" + s.id + "/upload", {
        caseId,
        accessToken: token,
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      uploading.current.delete(s.id);
    }
  }

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    let inFlight = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const s = await refresh();
        if (!cancelled && autoRef.current && caseId && token) {
          for (const x of s) {
            if (
              ["complete", "partial", "failed"].includes(x.status) &&
              x.packagePath &&
              !x.uploaded &&
              !x.uploadError
            ) void send(x);
          }
        }
      } catch {
        if (!cancelled) setError(ui.localSupportInterrupted);
      } finally {
        inFlight = false;
      }
    };
    void poll();
    const timer = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [connected, key, caseId, token, device?.serial, language]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const active = sessions.find(
    (s) =>
      ["recording", "interrupted", "awaiting_ylog_stop", "finalizing", "starting"].includes(s.status) &&
      s.device.serial === device?.serial,
  );

  return (
    <section className="capture-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{ui.assistedEyebrow}</span>
          <h1>{ui.assistedTitle}</h1>
          <p>{ui.assistedIntro}</p>
        </div>
        <span className={"status " + (connected ? "resolved" : "received")}>
          {connected ? ui.localConnected : ui.waitingConnection}
        </span>
      </div>

      <div className="capture-layout">
        <div>
          <section className="panel">
            <span className="eyebrow">{ui.connectStep}</span>
            <h2>{ui.prepareComputer}</h2>
            <p>{ui.prepareComputerText}</p>
            <a
              className="guide-link"
              href="https://github.com/PettaDev/CustomerAfterSales/blob/main/docs/SUPPORT_BRIDGE.md"
              target="_blank"
              rel="noreferrer"
            >
              <Monitor size={22} />
              <span><strong>{ui.installBridge}</strong><small>{ui.initialSetup}</small></span>
              <ArrowUpRight size={18} />
            </a>
            <label>
              {ui.connectionCode}
              <input
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setConnected(false);
                }}
                placeholder={ui.connectionCodePlaceholder}
              />
            </label>
            <button
              className="secondary"
              disabled={!key || busy}
              onClick={() => act(async () => {
                await bridge("/health");
                setConnected(true);
              })}
            >
              <Cable size={17} />{ui.connect}
            </button>
          </section>

          <section className="panel">
            <span className="eyebrow">{ui.authorizeStep}</span>
            <h2>{ui.connectDevice}</h2>
            <p>{ui.authorizeText}</p>
            <a href="/guide" target="_blank" rel="noreferrer" className="text-action">
              {ui.viewImageInstructions} <ArrowUpRight size={16} />
            </a>

            {devices.length === 0 ? (
              <div className="device-empty">
                <Smartphone size={30} />
                <p>{ui.noDevice}</p>
                <small>{ui.dataCableHint}</small>
              </div>
            ) : devices.map((d) => (
              <button
                className={"device-option " + (device?.serial === d.serial ? "selected" : "")}
                disabled={d.state !== "device" || !!active || busy}
                key={d.serial}
                onClick={() => act(async () => setDevice(await bridge("/devices/" + d.serial)))}
              >
                <Smartphone size={22} />
                <span>
                  {d.serial}
                  <small>
                    {d.state === "unauthorized" ? ui.authorizeComputer : d.state === "offline" ? ui.deviceOffline : ui.authorized}
                  </small>
                </span>
              </button>
            ))}

            {device && (
              <div className="device-facts">
                <strong>{device.brand} {device.model}</strong>
                <small>Android {device.android} · {device.build}</small>
                <span>{ui.platform}: {device.platform === "UNKNOWN" ? ui.unknownPlatform : device.platform}</span>
              </div>
            )}
          </section>

          <section className="panel">
            <span className="eyebrow">{ui.associateStep}</span>
            <h2>{ui.oneCaseMany}</h2>
            <label>{ui.caseProtocol}<input value={caseId} onChange={(e) => setCaseId(e.target.value.trim())} placeholder="CAS-…" /></label>
            <label>{ui.caseAccessCode}<input type="password" value={token} onChange={(e) => setToken(e.target.value.trim())} /></label>
            <label className="consent">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              <span>{ui.autoUpload}</span>
            </label>
          </section>
        </div>

        <div>
          <section className="capture-stage">
            <div className="stage-title"><span className="eyebrow">{ui.reproductionArea}</span><ShieldCheck size={18} /></div>
            <div className={"mirror-placeholder " + (active?.status === "recording" ? "recording" : "")}>
              <Monitor size={62} />
              <h2>{active?.status === "recording" ? ui.captureRunning : device ? ui.readyToView : ui.letsConnect}</h2>
              <p>{active?.status === "recording" ? ui.reproduceThenStop : ui.mirrorText}</p>
              <button
                className="secondary"
                disabled={!device || busy || !connected}
                onClick={() => act(() => bridge("/mirror", { serial: device.serial }))}
              >
                {ui.openView} <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="capture-controls">
              {device?.platform === "SPD" && !active && (
                <label className="consent">
                  <input type="checkbox" checked={ylog} onChange={(e) => setYlog(e.target.checked)} />
                  <span>{ui.ylogStarted}</span>
                </label>
              )}
              <label className="consent">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{ui.captureConsent}</span>
              </label>

              {!active ? (
                <button
                  className="primary"
                  disabled={!device || !consent || busy || device.platform === "UNKNOWN" || (device.platform === "SPD" && !ylog)}
                  onClick={() => act(() => bridge("/start", { serial: device.serial, ylogStarted: ylog }))}
                >
                  <Play size={18} />{ui.startCapture}
                </button>
              ) : active.status === "awaiting_ylog_stop" ? (
                <>
                  <p>{ui.stopYlogText}</p>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => act(() => bridge("/sessions/" + active.id + "/stop", { ylogStopped: true }))}
                  >
                    {ui.ylogStoppedCollect}
                  </button>
                </>
              ) : (
                <button
                  className="danger"
                  disabled={busy || active.status === "finalizing"}
                  onClick={() => act(() => bridge("/sessions/" + active.id + "/stop", {}))}
                >
                  <Square size={17} />{busy ? ui.finishingValidating : ui.stopSave}
                </button>
              )}

              {error && <p className="error" role="alert">{error}</p>}
            </div>
          </section>

          <section className="panel">
            <div className="table-title"><h2>{ui.capturesThisComputer}</h2><RefreshCw size={17} /></div>
            {!sessions.length ? (
              <p>{ui.capturesAppear}</p>
            ) : sessions.map((s) => (
              <div className="session-row" key={s.id}>
                <div><strong>{s.device.model}</strong><small>{new Date(s.startedAt).toLocaleString(locale)}</small></div>
                <span className={"status " + s.status}>{portalStatus(language, s.status)}</span>
                {s.reason && <p>{s.reason}</p>}
                {s.uploadError && <p className="error">{s.uploadError}</p>}
                {s.uploaded ? (
                  <small>{uiFormat(ui.uploadedTo, { caseId: s.caseId })}</small>
                ) : s.packagePath && (
                  <button className="secondary" disabled={!caseId || !token || busy} onClick={() => act(() => send(s))}>
                    <UploadCloud size={16} />{ui.sendToCase}
                  </button>
                )}
              </div>
            ))}
          </section>

          <a className="guide-link" href="/guide">
            <Smartphone size={24} />
            <span><strong>{ui.noComputerConnection}</strong><small>{ui.continueMobileGuide}</small></span>
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
