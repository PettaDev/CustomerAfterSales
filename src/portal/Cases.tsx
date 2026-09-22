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

type StaffProfile = { id: string; name: string; email: string; market: string; country: string; role: "tfae" | "manager" };
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
  staffMembers = [],
  staffProfile,
  back,
}: {
  id: string;
  token?: string;
  staff?: boolean;
  staffMembers?: StaffProfile[];
  staffProfile?: StaffProfile | null;
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
  const canEdit = staff && (!staffProfile || staffProfile.role === "tfae");
  const assignableStaff = staffMembers.filter((member) => member.role === "tfae");
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
      {staff && staffProfile?.role === "manager" && <div className="hint" role="note" style={{ marginBottom: 20 }}><FileText size={20}/><p><strong>{ui.managerReadOnlyTitle}</strong><br/>{ui.managerReadOnlyText}</p></div>}
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

            {canEdit && (
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
                  <label>{ui.owner}<select name="owner" defaultValue={c.owner || ""}><option value="">{ui.unassigned}</option>{c.owner && !assignableStaff.some((member) => member.name === c.owner) && <option value={c.owner}>{c.owner}</option>}{assignableStaff.map((member) => <option value={member.name} key={member.id}>{member.name}{member.country ? ` · ${member.country}` : ""}</option>)}</select></label>
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
                <p>{e.source === "customer" && e.note ? `${ui.customerReplyLabel}: ${e.note}` : e.source === "staff" && e.staffName ? `${e.staffName}: ${e.note || (e.status ? portalStatus(language, e.status) : ui.dataUpdated)}` : e.note || (e.status ? portalStatus(language, e.status) : ui.dataUpdated)}<small>{new Date(e.at).toLocaleString(locale)}</small></p>
              </div>
            ))}
            {!staff && c.status === "awaiting_customer" && <form onSubmit={sendCustomerReply}><label><strong>{ui.replyTitle}</strong><small style={{display:"block",margin:"6px 0 10px"}}>{ui.replyText}</small><textarea maxLength={2000} required value={reply} placeholder={ui.replyPlaceholder} onChange={(e)=>{setReply(e.target.value);setReplySent(false);}} /></label><button className="primary" disabled={busy||!reply.trim()}>{busy?ui.replySending:ui.sendReply}</button>{replySent&&<p className="success" role="status">{ui.replySent}</p>}</form>}
            {canEdit && (
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
  const [staffUser, setStaffUser] = useState<StaffProfile | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);
  const [staffOverview, setStaffOverview] = useState<(StaffProfile & { assigned: number; active: number })[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [loginStep, setLoginStep] = useState<"email" | "code">("email");
  const [authConfig, setAuthConfig] = useState({ emailCode: false, passwordFallback: false, trustedDeviceDays: 7, loaded: false });
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({ total: 0, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  async function finishLogin(session: any) {
    setAuth(true);
    setStaffUser(session.staff || null);
    const [team, overview] = await Promise.all([
      api("/auth/staff"),
      api("/auth/staff-overview"),
    ]);
    setStaffMembers(team.staff || []);
    setStaffOverview(overview.staff || []);
  }

  async function requestAccessCode() {
    setBusy(true);
    setError("");
    try {
      await api("/auth/request-code", post({ email, language }));
      setAccessCode("");
      setLoginStep("code");
    } catch {
      setError(ui.authRequestFailed);
    } finally {
      setBusy(false);
    }
  }

  async function verifyAccessCode() {
    setBusy(true);
    setError("");
    try {
      const session = await api("/auth/verify-code", post({
        email,
        code: accessCode,
        trustDevice,
      }));
      setAccessCode("");
      await finishLogin(session);
    } catch {
      setError(ui.authVerifyFailed);
    } finally {
      setBusy(false);
    }
  }

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("status", filter);
    if (query.trim()) params.set("q", query.trim());
    return Promise.all([
      api("/cases?" + params.toString()),
      api("/auth/staff-overview"),
    ])
      .then(([d, overview]) => {
        setCases(d.cases);
        setTotal(d.total ?? d.cases.length);
        setStats(d.stats ?? { total: d.cases.length, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 });
        setStaffOverview(overview.staff || []);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [filter, query]);

  useEffect(() => {
    Promise.all([api("/auth/me"), api("/auth/config")])
      .then(async ([x, config]) => {
        setAuthConfig({ ...config, loaded: true });
        setAuth(x.authenticated);
        setStaffUser(x.staff || null);
        if (x.authenticated) {
          const [team, overview] = await Promise.all([
            api("/auth/staff"),
            api("/auth/staff-overview"),
          ]);
          setStaffMembers(team.staff || []);
          setStaffOverview(overview.staff || []);
        }
      })
      .catch(() => setAuthConfig((current) => ({ ...current, loaded: true })));
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

        {!authConfig.loaded ? (
          <div className="panel"><p>{ui.loading}</p></div>
        ) : authConfig.emailCode ? (
          loginStep === "email" ? (
            <form className="panel" onSubmit={(e) => { e.preventDefault(); void requestAccessCode(); }}>
              <label>{ui.staffEmail}<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="primary" disabled={busy || !email.trim()}>{busy ? ui.sendingCode : ui.sendCode}<ArrowUpRight size={17} /></button>
            </form>
          ) : (
            <form className="panel" onSubmit={(e) => { e.preventDefault(); void verifyAccessCode(); }}>
              <div className="hint" role="status">
                <CheckCircle2 size={20}/>
                <p><strong>{ui.codeSentTitle}</strong><br/>{ui.codeSentText}<br/><small>{email}</small></p>
              </div>
              <label>{ui.accessCode}
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  aria-describedby="access-code-hint"
                />
                <small id="access-code-hint">{ui.codeDigitsHint}</small>
              </label>
              <label>
                <span><input type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} /> {ui.trustDevice}</span>
                <small>{ui.trustDeviceHint}</small>
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="primary" disabled={busy || accessCode.length !== 6}>{busy ? ui.verifyingCode : ui.verifyCode}<ArrowUpRight size={17} /></button>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" className="text-action" disabled={busy} onClick={() => void requestAccessCode()}>{ui.resendCode}</button>
                <button type="button" className="text-action" disabled={busy} onClick={() => { setLoginStep("email"); setAccessCode(""); setError(""); }}>{ui.useDifferentEmail}</button>
              </div>
            </form>
          )
        ) : (
          <form className="panel" onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const session = await api("/auth/login", post({ email, password }));
              setPassword("");
              await finishLogin(session);
            } catch {
              setError(ui.authPasswordFailed);
            } finally {
              setBusy(false);
            }
          }}>
            <div className="hint" role="status"><FileText size={20}/><p>{ui.emailCodeUnavailable}</p></div>
            <label>{ui.staffEmail}<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>{ui.password}<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="primary" disabled={busy}>{busy ? ui.signingIn : ui.accessDashboard}<ArrowUpRight size={17} /></button>
          </form>
        )}
      </div>
    );
  }

  if (selected) {
    return <CaseDetail id={selected} staff staffMembers={staffMembers} staffProfile={staffUser} back={() => { setSelected(""); void load(); }} />;
  }

  return (
    <section className="dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{ui.workspaceEyebrow}</span>
          <h1>{ui.workspaceTitle}</h1>
          <p>{ui.workspaceIntro}</p>{staffUser&&<p><strong>{ui.signedInAs}: {staffUser.name}</strong>{` · ${staffUser.role === "manager" ? ui.roleManager : ui.roleTfae}`}{staffUser.country?` · ${staffUser.country}`:""}{staffUser.market?` · ${staffUser.market}`:""}</p>}
        </div>
        <button className="secondary" onClick={async () => {
          await api("/auth/logout", post({}));
          setAuth(false);
          setStaffUser(null);
          setStaffMembers([]);
          setStaffOverview([]);
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

      {staffUser?.role === "manager" && <div className="table-panel" style={{ marginBottom: 24 }}>
        <div className="table-title"><h2>{ui.teamMonitoring}</h2></div>
        <div className="metrics">
          {staffOverview.map((member) => (
            <div className="metric" key={member.id}>
              <span>{member.name}<small style={{ display: "block" }}>{member.country}{member.market ? ` · ${member.market}` : ""}</small></span>
              <strong>{member.active.toString().padStart(2, "0")}</strong>
              <small>{ui.activeCases} · {member.assigned} {ui.assignedCases}</small>
            </div>
          ))}
        </div>
      </div>}

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
                  <th>{ui.caseProblem}</th><th>{ui.device}</th><th>{ui.status.toUpperCase()}</th><th>{ui.owner.toUpperCase()}</th><th>{ui.priority.toUpperCase()}</th><th>{ui.received}</th><th />
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td><button className="case-title" onClick={() => setSelected(c.id)}>{c.problem}<small>{c.id.slice(0, 12)} · {c.name}</small></button></td>
                    <td>{c.model}<small>{c.brand.toUpperCase()}</small></td>
                    <td><span className={"status " + c.status}>{portalStatus(language, c.status)}</span></td>
                    <td>{c.owner || ui.unassigned}</td>
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
