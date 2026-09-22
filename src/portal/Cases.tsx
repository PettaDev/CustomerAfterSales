import { useCallback, useEffect, useState } from "react";
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
  const [reply, setReply] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");

  const load = useCallback(() =>
    api("/cases/" + id, {}, token)
      .then(setData)
      .catch((e) => setError(e.message)), [id, token]);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function sendCustomerReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !reply.trim()) return;
    setBusy(true);
    setError("");
    setReplySent(false);
    try {
      await api("/cases/" + id + "/customer-replies", post({ message: reply.trim() }), token);
      setReply("");
      setReplySent(true);
      await load();
    } catch {
      setError(ui.replyFailed);
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
  const nextStepText =
    c.status === "reviewing" ? ui.nextReviewing :
    c.status === "awaiting_customer" ? ui.nextAwaitingCustomer :
    c.status === "resolved" ? ui.nextResolved :
    ui.nextReceived;
  const evidenceAccept = c.category === "hardware"
    ? ".png,.jpg,.jpeg,.mp4"
    : ".png,.jpg,.jpeg,.mp4,.zip,.txt,.log,.xml,.prop,.csv";

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
      {!staff && <div className="hint" role="status" style={{ marginBottom: 20 }}>
        <CheckCircle2 size={20}/>
        <p><strong>{ui.nextStepTitle}</strong><br/>{nextStepText}</p>
      </div>}

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
            {staff && c.category === "hardware" && <><h3>{ui.warrantyData}</h3><dl><div><dt>{ui.warrantyStatus}</dt><dd>{c.warrantyStatus === "yes" ? ui.warrantyYes : c.warrantyStatus === "no" ? ui.warrantyNo : ui.warrantyUnsure}</dd></div><div><dt>{ui.deviceIdentifier}</dt><dd>{c.deviceIdentifier || ui.notProvided}</dd></div><div><dt>{ui.purchaseDate}</dt><dd>{c.purchaseDate || ui.notProvided}</dd></div></dl></>}
          </section>

          <section className="panel" id="case-evidence">
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
              <>
                <label className="secondary">
                  {busy && uploadName
                    ? uiFormat(ui.uploadingFile, { name: uploadName, progress: uploadProgress })
                    : ui.addFile}
                  <input
                    type="file"
                    disabled={busy}
                    accept={evidenceAccept}
                    onChange={async (e) => {
                      const selected = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (!selected) return;
                      setBusy(true);
                      setError("");
                      setUploadName(selected.name);
                      setUploadProgress(0);
                      try {
                        await upload(id, token!, selected, setUploadProgress);
                        await load();
                      } catch {
                        setError(ui.uploadFailed);
                      } finally {
                        setBusy(false);
                        setUploadName("");
                        setUploadProgress(0);
                      }
                    }}
                  />
                </label>
                {busy && uploadName && <div className="progress" aria-label={uiFormat(ui.uploadingFile, { name: uploadName, progress: uploadProgress })}><i style={{width: `${uploadProgress}%`}}/></div>}
              </>
            )}
          </section>

          {(staff || c.category === "software") && <section className="panel">
            <h2>{staff ? ui.captureSessions : ui.computerEvidence}</h2>
            {data.sessions.length === 0 ? (
              <p>{ui.noCaptureSessions}</p>
            ) : data.sessions.map((session: any) => (
              <div className="session-row" key={session.id}>
                <strong>{session.device.model}</strong>
                <span>{portalStatus(language, session.status)}</span>
                <small>{new Date(session.startedAt).toLocaleString(locale)}</small>
                {staff && session.reason && <p>{session.reason}</p>}
              </div>
            ))}
          </section>}
        </div>

        <aside>
          <section className="panel">
            <h3>{ui.supportCase}</h3>
            <dl>
              <div><dt>{ui.customer}</dt><dd>{c.name}</dd></div>
              <div><dt>{ui.email}</dt><dd>{c.email}</dd></div>
              <div><dt>{ui.receivedAt}</dt><dd>{new Date(c.createdAt).toLocaleString(locale)}</dd></div>
              {staff && <div><dt>{ui.owner}</dt><dd>{c.owner || ui.unassigned}</dd></div>}
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
                <p>{e.source === "customer" && e.note ? `${ui.customerReplyLabel}: ${e.note}` : e.note || (e.status ? portalStatus(language, e.status) : ui.dataUpdated)}<small>{new Date(e.at).toLocaleString(locale)}</small></p>
              </div>
            ))}
            {!staff && c.status === "awaiting_customer" && <form onSubmit={sendCustomerReply}><label><strong>{ui.replyTitle}</strong><small style={{display:"block",margin:"6px 0 10px"}}>{ui.replyText}</small><textarea maxLength={2000} required value={reply} placeholder={ui.replyPlaceholder} onChange={(e)=>{setReply(e.target.value);setReplySent(false);}} /></label><button className="primary" disabled={busy||!reply.trim()}>{busy?ui.replySending:ui.sendReply}</button>{replySent&&<p className="success" role="status">{ui.replySent}</p>}</form>}
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
  const [stats, setStats] = useState({ total: 0, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("status", filter);
    if (query.trim()) params.set("q", query.trim());
    return api("/cases?" + params.toString())
      .then((d) => {
        setCases(d.cases);
        setTotal(d.total ?? d.cases.length);
        setStats(d.stats ?? { total: d.cases.length, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 });
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [filter, query]);

  useEffect(() => {
    api("/auth/me")
      .then((x) => setAuth(x.authenticated))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!auth) return;
    const timer = window.setTimeout(() => void load(), query.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [auth, load, query]);

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
          setTotal(0);
          setStats({ total: 0, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 });
        }}><LogOut size={16} />{ui.logout}</button>
      </div>

      <div className="metrics">
        {[
          { label: ui.totalCases, n: stats.total, icon: Inbox },
          { label: ui.awaitingAnalysis, n: stats.received, icon: FileText },
          { label: ui.inReview, n: stats.reviewing, icon: Clock },
          { label: ui.resolvedCases, n: stats.resolved, icon: CheckCircle2 },
        ].map((x) => (
          <div className="metric" key={x.label}>
            <span>{x.label}<x.icon size={19} /></span>
            <strong>{x.n.toString().padStart(2, "0")}</strong>
          </div>
        ))}
      </div>

      <div className="table-panel">
        <div className="table-title">
          <h2>{ui.caseCenter} <span className="count">{total}</span></h2>
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

        {cases.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{ui.caseProblem}</th><th>{ui.device}</th><th>{ui.status.toUpperCase()}</th><th>{ui.priority.toUpperCase()}</th><th>{ui.received}</th><th />
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
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
            <h3>{stats.total ? ui.noSearchResults : ui.readyFirstCase}</h3>
            <p>{stats.total ? ui.tryAnotherSearch : ui.casesWillAppear}</p>
          </div>
        )}
      </div>
    </section>
  );
}
