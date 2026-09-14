import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import BrowserCapture from "./BrowserCapture";
import { api, post, upload } from "./api";
import { portalText as tx } from "./portal-i18n";

export default function CustomerIntl({ navigate }: { navigate: (p: string) => void }) {
  useTranslation();
  const [step, setStep] = useState(0), [files, setFiles] = useState<File[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false), [result, setResult] = useState<any>(), [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ brand: "infinix", model: "", build: "", category: "software", problem: "", description: "", expected: "", carrier: "", name: "", email: "", phone: "", country: "Brasil", consent: false });
  const field = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const desktop = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const steps = [tx("device"), tx("issue"), tx("collection"), tx("details")];

  const addFiles = (incoming: File[]) => {
    if (incoming.some((x) => !x.size || x.size > 1024 ** 3)) return setError("Invalid file size.");
    setFiles((x) => [...x, ...incoming]); setError("");
  };
  async function submit() {
    setBusy(true); setError("");
    try {
      let r = result;
      if (!r) { r = await api("/cases", post(form)); setResult(r); sessionStorage.setItem("case-access", JSON.stringify({ id: r.case.id, token: r.accessToken })); }
      for (const file of files) await upload(r.case.id, r.accessToken, file);
      setFiles([]); setStep(4);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  if (step === 4) return <section className="customer-wrap"><div className="success-card">
    <span className="success-icon"><CheckCircle2 size={44} /></span><h1>{tx("received")}</h1><p>{tx("receivedText")}</p>
    <div className="access-box"><small>{tx("protocol")}</small><strong>{result.case.id}</strong><small>{tx("accessCode")}</small><code>{result.accessToken}</code></div>
    <button className="primary" onClick={async()=>{await navigator.clipboard.writeText(`${result.case.id}\n${result.accessToken}`);setCopied(true)}}><Copy size={17}/>{copied?tx("copied"):tx("copy")}</button>
    <button className="secondary" onClick={()=>navigate("tracking")}>{tx("track")}<ArrowRight size={17}/></button>{error&&<p className="error">{error}</p>}
  </div></section>;

  return <section className="customer-wrap">
    <div className="intro"><span className="eyebrow">AFTERCARE · TRANSSION</span><h1>{tx("intro")}</h1><p>{tx("introText")}</p></div>
    <div className="customer-layout"><aside className="journey"><span className="eyebrow">AFTERCARE</span>{steps.map((s,i)=><div key={s} className={`journey-step ${step===i?"current":step>i?"done":""}`}><span>{step>i?<Check size={16}/>:String(i+1).padStart(2,"0")}</span><div><strong>{s}</strong></div></div>)}<div className="privacy-note"><ShieldCheck size={20}/><p>Privacy-first diagnostic collection.</p></div></aside>
    <form className="form-card" onSubmit={(e)=>{e.preventDefault();step<3?setStep(step+1):void submit()}}>
      <div className="step-heading"><span>{tx("step",{n:step+1})}</span><small>{Math.round((step+1)*25)}%</small></div><div className="progress"><i style={{width:`${(step+1)*25}%`}}/></div>
      {step===0&&<><h2>{tx("device")}</h2><div className="brand-options">{["infinix","tecno","itel"].map(b=><button type="button" key={b} className={form.brand===b?"selected":""} onClick={()=>field("brand",b)}><img src={`/brandmarks/${b}.svg`} alt={b}/><span className="radio-mark">{form.brand===b&&<Check size={12}/>}</span></button>)}</div><label>{tx("model")}<input required minLength={2} maxLength={100} value={form.model} onChange={e=>field("model",e.target.value)}/></label><label>{tx("software")}<input required maxLength={180} value={form.build} onChange={e=>field("build",e.target.value)}/></label></>}
      {step===1&&<><h2>{tx("issue")}</h2><div className="choice-row">{["software","hardware"].map(x=><button type="button" key={x} className={`option ${form.category===x?"selected":""}`} onClick={()=>field("category",x)}><strong>{x}</strong></button>)}</div><label>{tx("problem")}<input required minLength={5} maxLength={180} value={form.problem} onChange={e=>field("problem",e.target.value)}/></label><label>{tx("reproduce")}<textarea required minLength={15} maxLength={5000} rows={4} value={form.description} onChange={e=>field("description",e.target.value)}/></label><label>{tx("expected")}<input maxLength={1000} value={form.expected} onChange={e=>field("expected",e.target.value)}/></label><label>{tx("carrier")}<input maxLength={80} value={form.carrier} onChange={e=>field("carrier",e.target.value)}/></label></>}
      {step===2&&<><h2>{desktop?tx("captureDesktop"):tx("captureMobile")}</h2>{desktop&&<BrowserCapture onFiles={addFiles} onDeviceInfo={info=>setForm(c=>({...c,brand:["infinix","tecno","itel"].includes(info.brand.toLowerCase())?info.brand.toLowerCase():c.brand,model:info.model||c.model,build:info.build||c.build}))}/>}<span className="manual-evidence-title">{tx("manualFiles")}</span><label className="dropzone"><UploadCloud size={34}/><strong>{tx("chooseFiles")}</strong><input type="file" multiple accept=".png,.jpg,.jpeg,.mp4,.txt,.zip" onChange={e=>addFiles(Array.from(e.target.files||[]))}/></label>{files.map((f,i)=><div className="file-row" key={f.name+i}><FileText size={18}/><span>{f.name}</span><button type="button" onClick={()=>setFiles(files.filter((_,n)=>n!==i))}>{tx("remove")}</button></div>)}</>}
      {step===3&&<><h2>{tx("contactTitle")}</h2><p>{tx("contactText")}</p><label>{tx("name")}<input required autoComplete="name" minLength={2} maxLength={100} value={form.name} onChange={e=>field("name",e.target.value)}/></label><label>{tx("email")}<input required type="email" autoComplete="email" maxLength={180} value={form.email} onChange={e=>field("email",e.target.value)}/></label><label>{tx("phone")}<input required type="tel" autoComplete="tel" minLength={6} maxLength={30} placeholder={tx("phonePlaceholder")} value={form.phone} onChange={e=>field("phone",e.target.value)}/></label><label>{tx("country")}<input required minLength={2} maxLength={80} value={form.country} onChange={e=>field("country",e.target.value)}/></label><label className="consent"><input type="checkbox" required checked={form.consent} onChange={e=>field("consent",e.target.checked)}/><span>{tx("consent")}</span></label></>}
      {error&&<p className="error">{error}</p>}<div className="form-actions">{step>0?<button type="button" className="text-action" onClick={()=>setStep(step-1)}><ArrowLeft size={17}/>{tx("back")}</button>:<small>Aftercare</small>}<button className="primary" disabled={busy}>{busy?tx("sending"):step===3?tx("submit"):tx("continue")}</button></div>
    </form></div>
  </section>;
}
