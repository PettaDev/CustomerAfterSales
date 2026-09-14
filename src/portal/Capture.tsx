import { useEffect, useState, useRef } from "react";
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
import { statusName } from "./api";
export default function Capture() {
  const [key, setKey] = useState(""),
    [connected, setConnected] = useState(false),
    [devices, setDevices] = useState<any[]>([]),
    [device, setDevice] = useState<any>(null),
    [sessions, setSessions] = useState<any[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ylog, setYlog] = useState(false),
    [consent, setConsent] = useState(false),
    [auto, setAuto] = useState(true),
    [caseId, setCaseId] = useState(""),
    [token, setToken] = useState("");
  const uploading = useRef(new Set<string>()),
    autoRef = useRef(false);
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
    if (d.devices.length === 1 && d.devices[0].state === "device" && !device)
      setDevice(await bridge("/devices/" + d.devices[0].serial));
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
    let cancelled = false,
      inFlight = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const s = await refresh();
        if (!cancelled && autoRef.current && caseId && token)
          for (const x of s)
            if (
              ["complete", "partial", "failed"].includes(x.status) &&
              x.packagePath &&
              !x.uploaded &&
              !x.uploadError
            )
              void send(x);
      } catch {
        if (!cancelled)
          setError(
            "Conexão com o suporte local interrompida. Verifique o programa no computador.",
          );
      } finally {
        inFlight = false;
      }
    };
    void poll();
    const t = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [connected, key, caseId, token, device?.serial]);
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
      [
        "recording",
        "interrupted",
        "awaiting_ylog_stop",
        "finalizing",
        "starting",
      ].includes(s.status) && s.device.serial === device?.serial,
  );
  return (
    <section className="capture-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DIAGNÓSTICO ASSISTIDO</span>
          <h1>Seu celular. Nossa atenção.</h1>
          <p>
            Reproduza o problema enquanto reunimos as informações para análise.
          </p>
        </div>
        <span className={"status " + (connected ? "resolved" : "received")}>
          {connected ? "Suporte local conectado" : "Aguardando conexão"}
        </span>
      </div>
      <div className="capture-layout">
        <div>
          <section className="panel">
            <span className="eyebrow">01 / CONECTAR</span>
            <h2>Prepare o computador.</h2>
            <p>
              Abra o Support Bridge no Windows e conecte o celular com um cabo
              USB de dados.
            </p>
            <a
              className="guide-link"
              href="https://github.com/PettaDev/CustomerAfterSales/blob/main/docs/SUPPORT_BRIDGE.md"
              target="_blank"
              rel="noreferrer"
            >
              <Monitor size={22} />
              <span>
                <strong>Instalar e abrir o Support Bridge</strong>
                <small>Configuração inicial no computador</small>
              </span>
              <ArrowUpRight size={18} />
            </a>
            <label>
              Código de conexão do programa
              <input
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setConnected(false);
                }}
                placeholder="Cole o código exibido ao abrir o programa"
              />
            </label>
            <button
              className="secondary"
              disabled={!key || busy}
              onClick={() =>
                act(async () => {
                  await bridge("/health");
                  setConnected(true);
                })
              }
            >
              <Cable size={17} />
              Conectar
            </button>
          </section>
          <section className="panel">
            <span className="eyebrow">02 / AUTORIZAR</span>
            <h2>Conecte seu aparelho.</h2>
            <p>
              Ative a depuração USB e aceite a autorização na tela do celular.
            </p>
            <a
              href="/guide"
              target="_blank"
              rel="noreferrer"
              className="text-action"
            >
              Ver instruções com imagens <ArrowUpRight size={16} />
            </a>
            {devices.length === 0 ? (
              <div className="device-empty">
                <Smartphone size={30} />
                <p>Nenhum aparelho detectado</p>
                <small>
                  Use um cabo de dados e mantenha a tela desbloqueada.
                </small>
              </div>
            ) : (
              devices.map((d) => (
                <button
                  className={
                    "device-option " +
                    (device?.serial === d.serial ? "selected" : "")
                  }
                  disabled={d.state !== "device" || !!active || busy}
                  key={d.serial}
                  onClick={() =>
                    act(async () =>
                      setDevice(await bridge("/devices/" + d.serial)),
                    )
                  }
                >
                  <Smartphone size={22} />
                  <span>
                    {d.serial}
                    <small>
                      {d.state === "unauthorized"
                        ? "Autorize este computador no aparelho"
                        : d.state === "offline"
                          ? "Aparelho offline"
                          : "Autorizado"}
                    </small>
                  </span>
                </button>
              ))
            )}
            {device && (
              <div className="device-facts">
                <strong>
                  {device.brand} {device.model}
                </strong>
                <small>
                  Android {device.android} · {device.build}
                </small>
                <span>
                  Plataforma:{" "}
                  {device.platform === "UNKNOWN"
                    ? "Não reconhecida"
                    : device.platform}
                </span>
              </div>
            )}
          </section>
          <section className="panel">
            <span className="eyebrow">03 / ASSOCIAR AO ATENDIMENTO</span>
            <h2>Um caso, várias reproduções.</h2>
            <label>
              Protocolo do caso
              <input
                value={caseId}
                onChange={(e) => setCaseId(e.target.value.trim())}
                placeholder="CAS-…"
              />
            </label>
            <label>
              Código de acesso ao caso
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
              />
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              <span>
                Enviar automaticamente as capturas finalizadas para este caso.
              </span>
            </label>
          </section>
        </div>
        <div>
          <section className="capture-stage">
            <div className="stage-title">
              <span className="eyebrow">ÁREA DE REPRODUÇÃO</span>
              <ShieldCheck size={18} />
            </div>
            <div
              className={
                "mirror-placeholder " +
                (active?.status === "recording" ? "recording" : "")
              }
            >
              <Monitor size={62} />
              <h2>
                {active?.status === "recording"
                  ? "Captura em andamento"
                  : device
                    ? "Pronto para visualizar"
                    : "Vamos conectar seu celular."}
              </h2>
              <p>
                {active?.status === "recording"
                  ? "Reproduza o problema no seu aparelho. Quando terminar, pare a captura."
                  : "A visualização do celular abre em uma janela no seu computador."}
              </p>
              <button
                className="secondary"
                disabled={!device || busy || !connected}
                onClick={() =>
                  act(() => bridge("/mirror", { serial: device.serial }))
                }
              >
                Abrir visualização <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="capture-controls">
              {device?.platform === "SPD" && !active && (
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={ylog}
                    onChange={(e) => setYlog(e.target.checked)}
                  />
                  <span>Já iniciei a coleta de logs no YLog do aparelho.</span>
                </label>
              )}
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Autorizo a gravação da tela e a coleta dos registros técnicos
                  desta reprodução.
                </span>
              </label>
              {!active ? (
                <button
                  className="primary"
                  disabled={
                    !device ||
                    !consent ||
                    busy ||
                    device.platform === "UNKNOWN" ||
                    (device.platform === "SPD" && !ylog)
                  }
                  onClick={() =>
                    act(() =>
                      bridge("/start", {
                        serial: device.serial,
                        ylogStarted: ylog,
                      }),
                    )
                  }
                >
                  <Play size={18} />
                  Iniciar captura
                </button>
              ) : active.status === "awaiting_ylog_stop" ? (
                <>
                  <p>
                    A gravação de tela já parou. Pare os logs no YLog do
                    aparelho para continuar.
                  </p>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      act(() =>
                        bridge("/sessions/" + active.id + "/stop", {
                          ylogStopped: true,
                        }),
                      )
                    }
                  >
                    Já parei os logs — coletar arquivos
                  </button>
                </>
              ) : (
                <button
                  className="danger"
                  disabled={busy || active.status === "finalizing"}
                  onClick={() =>
                    act(() => bridge("/sessions/" + active.id + "/stop", {}))
                  }
                >
                  <Square size={17} />
                  {busy ? "Finalizando e validando…" : "Parar e salvar captura"}
                </button>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="table-title">
              <h2>Capturas deste computador</h2>
              <RefreshCw size={17} />
            </div>
            {!sessions.length ? (
              <p>
                Suas reproduções aparecerão aqui. Cada uma gera um pacote
                independente.
              </p>
            ) : (
              sessions.map((s) => (
                <div className="session-row" key={s.id}>
                  <div>
                    <strong>{s.device.model}</strong>
                    <small>
                      {new Date(s.startedAt).toLocaleString("pt-BR")}
                    </small>
                  </div>
                  <span className={"status " + s.status}>
                    {statusName[s.status] || s.status}
                  </span>
                  {s.reason && <p>{s.reason}</p>}
                  {s.uploadError && <p className="error">{s.uploadError}</p>}
                  {s.uploaded ? (
                    <small>Enviado para {s.caseId}</small>
                  ) : (
                    s.packagePath && (
                      <button
                        className="secondary"
                        disabled={!caseId || !token || busy}
                        onClick={() => act(() => send(s))}
                      >
                        <UploadCloud size={16} />
                        Enviar para o caso
                      </button>
                    )
                  )}
                </div>
              ))
            )}
          </section>
          <a className="guide-link" href="/guide">
            <Smartphone size={24} />
            <span>
              <strong>Sem computador ou conexão?</strong>
              <small>Continue com o guia usando apenas o celular.</small>
            </span>
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
