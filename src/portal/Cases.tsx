import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { api, post, upload, type Case } from "./api";
import {
  portalDateLocale,
  portalPriority,
  portalStatus,
  portalUi,
  uiFormat,
} from "./portal-ui-i18n";

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
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const ui = portalUi(language);
  const locale = portalDateLocale(language);
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

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

  async function download(evidence: any) {
    try {
      const r = await fetch("/api/evidence/" + evidence.id + "/download", {
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
      if (!r.ok) throw Error(ui.unavailableFile);
      if (r.headers.get("content-type")?.includes("application/json")) {
        const d = await r.json();
        window.open(d.url, "_blank", "noopener");
      } else {
        const url = URL.createObjectURL(await r.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = evidence.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!data) {
    return (
      <div className="empty">
        <p>{error || ui.loadingCase}</p>
        <button onClick={back}>{ui.back}</button>
      </div>
    );
  }

  const c: Case = data.case;

  return (
    <div className="detail">
      <button className="text-action" onClick={back}>
        <ArrowLeft size={16} />
        {ui.back}
      </button>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{c.id}</span>
          <h1>{c.problem}</h1>
          <p>{c.brand.toUpperCase()} · {c.model} · {c.country}</p>
        </div>
        <span className={"status " + c.status}>{portalStatus(language, c.status)}</span>
      </div>

      {error && <p role="alert" className="error">{error}</p>}

      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2>{ui.customerReport}</h2>
            <p className="preserve">{c.description}</p>
            <h3>{ui.expectedBehavior}</h3>
            <p>{c.expected || ui.notProvided}</p>
            <dl>
              <div><dt>{ui.software}</dt><dd>{c.build || ui.notProvided}</dd></div>
              <div><dt>{ui.carrier}</dt><dd>{c.carrier || ui.notProvided}</dd></div>
              <div><dt>{ui.category}</dt><dd>{c.category === "software" ? ui.systemApps : ui.hardware}</dd></div>
            </dl>
          </section>

          <section className="panel">
            <h2>{ui.evidence} <span className="count">{data.evidence.length}</span></h2>
            {data.evidence.length === 0 ? (
              <p>{ui.noEvidence}</p>
            ) : data.evidence.map((e: any) => (
              <div className="file-row" key={e.id}>
                <FileText size={20} />
                <span>{e.name}<small>{(e.size / 1024 / 1024).toFixed(1)} MB</small></span>
                <button onClick={() => download(e)}><Download size={17} />{ui.download}</button>
              </div>
            ))}
            {!staff && (
              <label className="secondary">
                {ui.addFile}
                <input
                  type="file"
                  disabled={busy}
                  accept=".png,.jpg,.jpeg,.mp4,.zip,.txt,.log,.xml,.prop,.csv"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBusy(true);
                    try {
                      await upload(id, token!, f);
                      await load();
                    } catch (error) {
                      setError((error as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
            )}
          </section>

          <section className="panel">
            <h2>{ui.captureSessions}</h2>
            {data.sessions.length === 0 ? (
              <p>{ui.noCaptureSessions}</p>
            ) : data.sessions.map((s: any) => (
              <div className="session-row" key={s.id}>
                <strong>{s.device.model}</strong>
                <span>{portalStatus(language, s.status)}</span>
                <small>{new Date(s.startedAt).toLocaleString(locale)}</small>
                {s.reason && <p>{s.reason}</p>}
              </div>
            ))}
          </section>
        </div>

        <aside>
          <section className="panel">
            <h3>{ui.supportCase}</h3>
            <dl>
              <div><dt>{ui.customer}</dt><dd>{c.name}</dd></div>
              <div><dt>{ui.email}</dt><dd>{c.email}</dd></div>
              <div><dt>{ui.receivedAt}</dt><dd>{new Date(c.createdAt).toLocaleString(locale)}</dd></div>
              <div><dt>{ui.owner}</dt><dd>{c.owner || ui.unassigned}</dd></div>
            </dl>

            {staff && (
              <>
                <label>
                  {ui.status}
                  <select value={c.status} disabled={busy} onChange={(e) => change({ status: e.target.value })}>
                    {["received", "reviewing", "awaiting_customer", "resolved"].map((s) => (
                      <option value={s} key={s}>{portalStatus(language, s)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {ui.priority}
                  <select value={c.priority} disabled={busy} onChange={(e) => change({ priority: e.target.value })}>
                    {["normal", "high", "urgent"].map((p) => <option value={p} key={p}>{portalPriority(language, p)}</option>)}
                  </select>
                </label>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const v = new FormData(e.currentTarget);
                  void change({ owner: v.get("owner") });
                }}>
                  <label>{ui.owner}<input name="owner" maxLength={100} defaultValue={c.owner || ""} /></label>
                  <button className="secondary" disabled={busy}>{ui.assign}</button>
                </form>
              </>
            )}
          </section>

          <section className="panel">
            <h3>{ui.updates}</h3>
            <div className="timeline-item">
              <Clock size={16} />
              <p>{ui.caseReceived}<small>{new Date(c.createdAt).toLocaleDateString(locale)}</small></p>
            </div>
            {data.events.map((e: any) => (
              <div className="timeline-item" key={e.id}>
                <Clock size={16} />
                <p>{e.note || (e.status ? portalStatus(language, e.status) : ui.dataUpdated)}<small>{new Date(e.at).toLocaleString(locale)}</small></p>
              </div>
            ))}
            {staff && (
              <form onSubmit={(e) => { e.preventDefault(); void change({ note }); }}>
                <label>
                  {ui.visibleUpdate}
                  <textarea maxLength={2000} required value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <button className="primary" disabled={busy}>{ui.publishUpdate}</button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export function Tracking() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const ui = portalUi(language);
  const [creds, setCreds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("case-access") || "null"); }
    catch { return null; }
  });
  const [id, setId] = useState("");
  const [token, setToken] = useState("");

  if (creds) {
    return <CaseDetail id={creds.id} token={creds.token} back={() => {
      setCreds(null);
      sessionStorage.removeItem("case-access");
    }} />;
  }

  return (
    <div className="narrow">
      <span className="eyebrow">{ui.trackingEyebrow}</span>
      <h1>{ui.trackingTitle}</h1>
      <p>{ui.trackingText}</p>
      <form className="panel" onSubmit={(e) => {
        e.preventDefault();
        setCreds({ id: id.trim(), token: token.trim() });
      }}>
        <label>{ui.protocol}<input required value={id} onChange={(e) => setId(e.target.value)} placeholder="CAS-…" /></label>
        <label>{ui.accessCode}<input required type="password" value={token} onChange={(e) => setToken(e.target.value)} /></label>
        <button className="primary">{ui.viewCase} <ArrowUpRight size={17} /></button>
      </form>
    </div>
  );
}

export function Dashboard() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const ui = portalUi(language);
  const locale = portalDateLocale(language);
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const load = () => api("/cases").then((d) => setCases(d.cases)).catch((e) => setError(e.message));

  useEffect(() => {
    api("/auth/me")
      .then((x) => {
        setAuth(x.authenticated);
        if (x.authenticated) void load();
      })
      .catch((e) => setError(e.message));
  }, []);

  if (!auth) {
    return (
      <div className="narrow">
        <span className="eyebrow">{ui.staffArea}</span>
        <h1>{ui.helloTfae}</h1>
        <p>{ui.staffIntro}</p>
        <form className="panel" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("/auth/login", post({ email, password }));
            setPassword("");
            setAuth(true);
            await load();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}>
          <label>{ui.staffEmail}<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>{ui.password}<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? ui.signingIn : ui.accessDashboard}<ArrowUpRight size={17} /></button>
        </form>
      </div>
    );
  }

  if (selected) {
    return <CaseDetail id={selected} staff back={() => { setSelected(""); void load(); }} />;
  }

  const shown = cases.filter((c) =>
    (filter === "all" || c.status === filter) &&
    [c.problem, c.model, c.id, c.name, c.country].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{ui.workspaceEyebrow}</span>
          <h1>{ui.workspaceTitle}</h1>
          <p>{ui.workspaceIntro}</p>
        </div>
        <button className="secondary" onClick={async () => {
          await api("/auth/logout", post({}));
          setAuth(false);
          setCases([]);
        }}><LogOut size={16} />{ui.logout}</button>
      </div>

      <div className="metrics">
        {[
          { label: ui.totalCases, n: cases.length, icon: Inbox },
          { label: ui.awaitingAnalysis, n: cases.filter((c) => c.status === "received").length, icon: FileText },
          { label: ui.inReview, n: cases.filter((c) => c.status === "reviewing").length, icon: Clock },
          { label: ui.resolvedCases, n: cases.filter((c) => c.status === "resolved").length, icon: CheckCircle2 },
        ].map((x) => (
          <div className="metric" key={x.label}>
            <span>{x.label}<x.icon size={19} /></span>
            <strong>{x.n.toString().padStart(2, "0")}</strong>
          </div>
        ))}
      </div>

      <div className="table-panel">
        <div className="table-title">
          <h2>{ui.caseCenter} <span className="count">{cases.length}</span></h2>
          <button className="text-action" onClick={() => void load()}>{ui.refresh}</button>
        </div>
        <div className="filters">
          <div role="group" aria-label={ui.filterStatus}>
            {["all", "received", "reviewing", "awaiting_customer", "resolved"].map((s) => (
              <button className={filter === s ? "active" : ""} onClick={() => setFilter(s)} key={s}>
                {s === "all" ? ui.all : portalStatus(language, s)}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={17} />
            <input aria-label={ui.searchCases} placeholder={ui.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {shown.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{ui.caseProblem}</th><th>{ui.device}</th><th>{ui.status.toUpperCase()}</th><th>{ui.priority.toUpperCase()}</th><th>{ui.received}</th><th />
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td><button className="case-title" onClick={() => setSelected(c.id)}>{c.problem}<small>{c.id.slice(0, 12)} · {c.name}</small></button></td>
                    <td>{c.model}<small>{c.brand.toUpperCase()}</small></td>
                    <td><span className={"status " + c.status}>{portalStatus(language, c.status)}</span></td>
                    <td>{portalPriority(language, c.priority)}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString(locale)}</td>
                    <td><button aria-label={uiFormat(ui.openCase, { problem: c.problem })} onClick={() => setSelected(c.id)}><ArrowUpRight size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <Inbox size={36} />
            <h3>{cases.length ? ui.noSearchResults : ui.readyFirstCase}</h3>
            <p>{cases.length ? ui.tryAnotherSearch : ui.casesWillAppear}</p>
          </div>
        )}
      </div>
    </section>
  );
}
