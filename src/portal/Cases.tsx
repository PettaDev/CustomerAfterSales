import { useEffect, useState } from "react";
import {
  Search,
  ArrowUpRight,
  FileText,
  Clock,
  CheckCircle2,
  Inbox,
  Download,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { api, post, upload, statusName, type Case } from "./api";
export function CaseDetail({
  id,
  token,
  staff = false,
  back,
}: {
  id: string;
  token?: string;
  staff?: boolean;
  back: () => void;
}) {
  const [data, setData] = useState<any>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  const load = () =>
    api("/cases/" + id, {}, token)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, [id]);
  async function change(changes: unknown) {
    setBusy(true);
    try {
      await api(
        "/cases/" + id,
        { method: "PATCH", body: JSON.stringify(changes) },
        token,
      );
      setNote("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function download(e: any) {
    try {
      const r = await fetch("/api/evidence/" + e.id + "/download", {
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
      if (!r.ok) throw Error("Arquivo indisponível.");
      if (r.headers.get("content-type")?.includes("application/json")) {
        const d = await r.json();
        window.open(d.url, "_blank", "noopener");
      } else {
        const url = URL.createObjectURL(await r.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = e.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!data)
    return (
      <div className="empty">
        <p>{error || "Carregando atendimento…"}</p>
        <button onClick={back}>Voltar</button>
      </div>
    );
  const c: Case = data.case;
  return (
    <div className="detail">
      <button className="text-action" onClick={back}>
        <ArrowLeft size={16} />
        Voltar
      </button>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{c.id}</span>
          <h1>{c.problem}</h1>
          <p>
            {c.brand.toUpperCase()} · {c.model} · {c.country}
          </p>
        </div>
        <span className={"status " + c.status}>{statusName[c.status]}</span>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2>Relato do cliente</h2>
            <p className="preserve">{c.description}</p>
            <h3>Comportamento esperado</h3>
            <p>{c.expected || "Não informado"}</p>
            <dl>
              <div>
                <dt>Software</dt>
                <dd>{c.build || "Não informado"}</dd>
              </div>
              <div>
                <dt>Operadora</dt>
                <dd>{c.carrier || "Não informada"}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>
                  {c.category === "software"
                    ? "Sistema e aplicativos"
                    : "Hardware"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="panel">
            <h2>
              Evidências <span className="count">{data.evidence.length}</span>
            </h2>
            {data.evidence.length === 0 ? (
              <p>Nenhum arquivo enviado ainda.</p>
            ) : (
              data.evidence.map((e: any) => (
                <div className="file-row" key={e.id}>
                  <FileText size={20} />
                  <span>
                    {e.name}
                    <small>{(e.size / 1024 / 1024).toFixed(1)} MB</small>
                  </span>
                  <button onClick={() => download(e)}>
                    <Download size={17} />
                    Baixar
                  </button>
                </div>
              ))
            )}
            {!staff && (
              <label className="secondary">
                Adicionar arquivo
                <input
                  type="file"
                  disabled={busy}
                  accept=".png,.jpg,.jpeg,.mp4,.zip,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBusy(true);
                    try {
                      await upload(id, token!, f);
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
            )}
          </section>
          <section className="panel">
            <h2>Sessões de captura</h2>
            {data.sessions.length === 0 ? (
              <p>Nenhuma coleta pelo computador associada.</p>
            ) : (
              data.sessions.map((s: any) => (
                <div className="session-row" key={s.id}>
                  <strong>{s.device.model}</strong>
                  <span>{statusName[s.status]}</span>
                  <small>{new Date(s.startedAt).toLocaleString("pt-BR")}</small>
                  {s.reason && <p>{s.reason}</p>}
                </div>
              ))
            )}
          </section>
        </div>
        <aside>
          <section className="panel">
            <h3>Atendimento</h3>
            <dl>
              <div>
                <dt>Cliente</dt>
                <dd>{c.name}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{c.email}</dd>
              </div>
              <div>
                <dt>Recebido em</dt>
                <dd>{new Date(c.createdAt).toLocaleString("pt-BR")}</dd>
              </div>
              <div>
                <dt>Responsável</dt>
                <dd>{c.owner || "Ainda não atribuído"}</dd>
              </div>
            </dl>
            {staff && (
              <>
                <label>
                  Status
                  <select
                    value={c.status}
                    disabled={busy}
                    onChange={(e) => change({ status: e.target.value })}
                  >
                    {[
                      "received",
                      "reviewing",
                      "awaiting_customer",
                      "resolved",
                    ].map((s) => (
                      <option value={s} key={s}>
                        {statusName[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Prioridade
                  <select
                    value={c.priority}
                    disabled={busy}
                    onChange={(e) => change({ priority: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = new FormData(e.currentTarget);
                    void change({ owner: v.get("owner") });
                  }}
                >
                  <label>
                    Responsável
                    <input
                      name="owner"
                      maxLength={100}
                      defaultValue={c.owner || ""}
                    />
                  </label>
                  <button className="secondary" disabled={busy}>
                    Atribuir
                  </button>
                </form>
              </>
            )}
          </section>
          <section className="panel">
            <h3>Atualizações</h3>
            <div className="timeline-item">
              <Clock size={16} />
              <p>
                Caso recebido
                <small>
                  {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                </small>
              </p>
            </div>
            {data.events.map((e: any) => (
              <div className="timeline-item" key={e.id}>
                <Clock size={16} />
                <p>
                  {e.note || statusName[e.status] || "Dados atualizados"}
                  <small>{new Date(e.at).toLocaleString("pt-BR")}</small>
                </p>
              </div>
            ))}
            {staff && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void change({ note });
                }}
              >
                <label>
                  Atualização visível ao cliente
                  <textarea
                    maxLength={2000}
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <button className="primary" disabled={busy}>
                  Publicar atualização
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
export function Tracking() {
  const [creds, setCreds] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem("case-access") || "null");
      } catch {
        return null;
      }
    }),
    [id, setId] = useState(""),
    [token, setToken] = useState("");
  if (creds)
    return (
      <CaseDetail
        id={creds.id}
        token={creds.token}
        back={() => {
          setCreds(null);
          sessionStorage.removeItem("case-access");
        }}
      />
    );
  return (
    <div className="narrow">
      <span className="eyebrow">ACOMPANHAMENTO</span>
      <h1>Seu caso, por aqui.</h1>
      <p>Use os dados recebidos ao finalizar o atendimento.</p>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          setCreds({ id: id.trim(), token: token.trim() });
        }}
      >
        <label>
          Protocolo
          <input
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="CAS-…"
          />
        </label>
        <label>
          Código de acesso
          <input
            required
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <button className="primary">
          Consultar caso <ArrowUpRight size={17} />
        </button>
      </form>
    </div>
  );
}
export function Dashboard() {
  const [auth, setAuth] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [cases, setCases] = useState<Case[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState("");
  const load = () =>
    api("/cases")
      .then((d) => setCases(d.cases))
      .catch((e) => setError(e.message));
  useEffect(() => {
    api("/auth/me")
      .then((x) => {
        setAuth(x.authenticated);
        if (x.authenticated) void load();
      })
      .catch((e) => setError(e.message));
  }, []);
  if (!auth)
    return (
      <div className="narrow">
        <span className="eyebrow">ÁREA DA EQUIPE</span>
        <h1>Olá, TFAE.</h1>
        <p>Acesse os atendimentos e as evidências dos clientes.</p>
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/auth/login", post({ email, password }));
              setPassword("");
              setAuth(true);
              await load();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            E-mail da equipe
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Entrando…" : "Acessar painel"}
            <ArrowUpRight size={17} />
          </button>
        </form>
      </div>
    );
  if (selected)
    return (
      <CaseDetail
        id={selected}
        staff
        back={() => {
          setSelected("");
          void load();
        }}
      />
    );
  const shown = cases.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      [c.problem, c.model, c.id, c.name, c.country]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">TFAE WORKSPACE / VISÃO GERAL</span>
          <h1>Cada caso merece atenção.</h1>
          <p>Organize a análise. Conecte as evidências. Acompanhe a solução.</p>
        </div>
        <button
          className="secondary"
          onClick={async () => {
            await api("/auth/logout", post({}));
            setAuth(false);
            setCases([]);
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
      <div className="metrics">
        {[
          { label: "Total de casos", n: cases.length, icon: Inbox },
          {
            label: "Aguardando análise",
            n: cases.filter((c) => c.status === "received").length,
            icon: FileText,
          },
          {
            label: "Em análise",
            n: cases.filter((c) => c.status === "reviewing").length,
            icon: Clock,
          },
          {
            label: "Resolvidos",
            n: cases.filter((c) => c.status === "resolved").length,
            icon: CheckCircle2,
          },
        ].map((x) => (
          <div className="metric" key={x.label}>
            <span>
              {x.label}
              <x.icon size={19} />
            </span>
            <strong>{x.n.toString().padStart(2, "0")}</strong>
          </div>
        ))}
      </div>
      <div className="table-panel">
        <div className="table-title">
          <h2>
            Central de atendimentos{" "}
            <span className="count">{cases.length}</span>
          </h2>
          <button className="text-action" onClick={() => void load()}>
            Atualizar
          </button>
        </div>
        <div className="filters">
          <div role="group" aria-label="Filtrar status">
            {[
              "all",
              "received",
              "reviewing",
              "awaiting_customer",
              "resolved",
            ].map((s) => (
              <button
                className={filter === s ? "active" : ""}
                onClick={() => setFilter(s)}
                key={s}
              >
                {s === "all" ? "Todos" : statusName[s]}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Buscar casos"
              placeholder="Buscar caso, modelo, cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {shown.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>CASO / PROBLEMA</th>
                  <th>APARELHO</th>
                  <th>STATUS</th>
                  <th>PRIORIDADE</th>
                  <th>RECEBIDO</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="case-title"
                        onClick={() => setSelected(c.id)}
                      >
                        {c.problem}
                        <small>
                          {c.id.slice(0, 12)} · {c.name}
                        </small>
                      </button>
                    </td>
                    <td>
                      {c.model}
                      <small>{c.brand.toUpperCase()}</small>
                    </td>
                    <td>
                      <span className={"status " + c.status}>
                        {statusName[c.status]}
                      </span>
                    </td>
                    <td>
                      {
                        (
                          {
                            normal: "Normal",
                            high: "Alta",
                            urgent: "Urgente",
                          } as any
                        )[c.priority]
                      }
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <button
                        aria-label={"Abrir " + c.problem}
                        onClick={() => setSelected(c.id)}
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <Inbox size={36} />
            <h3>
              {cases.length
                ? "Nenhum caso corresponde à busca."
                : "Tudo pronto para o primeiro atendimento."}
            </h3>
            <p>
              {cases.length
                ? "Experimente outro termo ou filtro."
                : "Os casos enviados pelos clientes aparecerão aqui."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
