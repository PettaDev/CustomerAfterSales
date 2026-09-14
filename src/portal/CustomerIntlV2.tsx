import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  ShieldCheck,
  Smartphone,
  UploadCloud,
} from "lucide-react";
import BrowserCapture from "./BrowserCapture";
import { api, post, upload } from "./api";
import { portalText as tx } from "./portal-i18n";

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

type UxCopy = {
  issueTypePrompt: string;
  softwareProblem: string;
  softwareProblemDesc: string;
  softwareProblemExamples: string;
  hardwareProblem: string;
  hardwareProblemDesc: string;
  hardwareProblemExamples: string;
  problemHelp: string;
  problemPlaceholderSoftware: string;
  problemPlaceholderHardware: string;
  reproduceHelp: string;
  reproducePlaceholderSoftware: string;
  reproducePlaceholderHardware: string;
  expectedHelp: string;
  expectedPlaceholder: string;
  carrierHelp: string;
  carrierPlaceholder: string;
  collectionTitle: string;
  collectionText: string;
  evidenceRequired: string;
  sendError: string;
  fileSizeError: string;
};

function uxCopy(language: string): UxCopy {
  if (language.startsWith("pt")) return {
    issueTypePrompt: "Primeiro, escolha a opção que mais se parece com o problema.",
    softwareProblem: "Problema de software",
    softwareProblemDesc: "Falha no sistema, aplicativo ou conexão, mesmo sem dano físico aparente.",
    softwareProblemExamples: "Ex.: app fecha sozinho, Wi‑Fi/Bluetooth desconecta, aparelho reinicia, notificações não chegam, erro após atualização.",
    hardwareProblem: "Problema de hardware",
    hardwareProblemDesc: "Falha em uma peça ou componente físico do aparelho.",
    hardwareProblemExamples: "Ex.: tela com linhas/manchas, touch não responde, não carrega, microfone ou alto-falante sem funcionar, botão quebrado.",
    problemHelp: "Resuma em uma frase o principal sintoma. Não precisa explicar tudo aqui.",
    problemPlaceholderSoftware: "Ex.: Wi‑Fi desconecta sozinho depois de alguns minutos",
    problemPlaceholderHardware: "Ex.: Tela apresenta linhas verdes e o toque falha no lado direito",
    reproduceHelp: "Conte o passo a passo até o problema acontecer. Inclua o aplicativo/tela usada e o que você faz antes da falha.",
    reproducePlaceholderSoftware: "Ex.: 1. Abra Configurações > Wi‑Fi. 2. Conecte à rede. 3. Use o celular por 2–3 minutos. 4. O Wi‑Fi desconecta sozinho.",
    reproducePlaceholderHardware: "Ex.: 1. Ligue a tela. 2. Abra qualquer aplicativo. 3. Toque no lado direito. 4. O toque não responde nessa região.",
    expectedHelp: "Explique como o aparelho deveria se comportar normalmente.",
    expectedPlaceholder: "Ex.: O Wi‑Fi deveria permanecer conectado sem interrupções.",
    carrierHelp: "Informe a operadora usada. Se o problema não envolver rede móvel ou não se aplicar, escreva “Não se aplica”.",
    carrierPlaceholder: "Ex.: Vivo, TIM, Claro — ou Não se aplica",
    collectionTitle: "Reproduza o problema durante a coleta.",
    collectionText: "Depois de conectar o aparelho, inicie a coleta e faça no celular os mesmos passos que causam a falha. Quando o problema aparecer, volte para esta página e finalize a coleta. Você precisa ter pelo menos uma evidência antes de continuar.",
    evidenceRequired: "Adicione pelo menos uma evidência antes de continuar. Conecte o aparelho e finalize uma coleta, ou envie um arquivo manualmente.",
    sendError: "Não foi possível concluir o envio. Seus dados continuam nesta tela. Verifique a mensagem abaixo e tente novamente.",
    fileSizeError: "Não foi possível adicionar um dos arquivos. Cada evidência precisa ter conteúdo e no máximo 1 GB.",
  };
  if (language.startsWith("es")) return {
    issueTypePrompt: "Primero, elige la opción que más se parezca al problema.",
    softwareProblem: "Problema de software",
    softwareProblemDesc: "Falla del sistema, una aplicación o una conexión, sin un daño físico evidente.",
    softwareProblemExamples: "Ej.: una app se cierra, Wi‑Fi/Bluetooth se desconecta, el teléfono se reinicia, no llegan notificaciones, falla después de actualizar.",
    hardwareProblem: "Problema de hardware",
    hardwareProblemDesc: "Falla relacionada con una pieza o componente físico del dispositivo.",
    hardwareProblemExamples: "Ej.: líneas/manchas en pantalla, zona táctil sin respuesta, no carga, micrófono/altavoz falla, botón roto.",
    problemHelp: "Resume el síntoma principal en una sola frase. Puedes explicar todo abajo.",
    problemPlaceholderSoftware: "Ej.: El Wi‑Fi se desconecta solo después de unos minutos",
    problemPlaceholderHardware: "Ej.: Aparecen líneas verdes en pantalla y el táctil falla del lado derecho",
    reproduceHelp: "Describe paso a paso hasta que aparezca el problema. Incluye la app/pantalla y qué haces justo antes de la falla.",
    reproducePlaceholderSoftware: "Ej.: 1. Abre Ajustes > Wi‑Fi. 2. Conéctate a la red. 3. Usa el teléfono 2–3 minutos. 4. El Wi‑Fi se desconecta.",
    reproducePlaceholderHardware: "Ej.: 1. Enciende la pantalla. 2. Abre cualquier app. 3. Toca el lado derecho. 4. Esa zona no responde.",
    expectedHelp: "Explica cómo debería comportarse normalmente el dispositivo.",
    expectedPlaceholder: "Ej.: El Wi‑Fi debería permanecer conectado sin interrupciones.",
    carrierHelp: "Indica el operador que utilizas. Si el problema no está relacionado con la red móvil o no aplica, escribe “No aplica”.",
    carrierPlaceholder: "Ej.: Telcel, Claro, Movistar — o No aplica",
    collectionTitle: "Reproduce el problema durante la recopilación.",
    collectionText: "Después de conectar el dispositivo, inicia la recopilación y realiza en el teléfono los mismos pasos que provocan la falla. Cuando ocurra, vuelve a esta página y finaliza la recopilación. Debes tener al menos una evidencia para continuar.",
    evidenceRequired: "Agrega al menos una evidencia antes de continuar. Finaliza una recopilación del dispositivo o carga un archivo manualmente.",
    sendError: "No pudimos completar el envío. Tus datos siguen en esta página. Revisa el mensaje a continuación e inténtalo de nuevo.",
    fileSizeError: "No se pudo agregar uno de los archivos. Cada evidencia debe contener datos y tener como máximo 1 GB.",
  };
  if (language.startsWith("zh")) return {
    issueTypePrompt: "请先选择最符合当前问题的类型。",
    softwareProblem: "软件问题",
    softwareProblemDesc: "系统、应用或连接功能异常，且没有明显的物理损坏。",
    softwareProblemExamples: "例如：应用闪退、Wi‑Fi/蓝牙自动断开、手机重启、通知不到、系统更新后出现异常。",
    hardwareProblem: "硬件问题",
    hardwareProblemDesc: "与设备的实体零件或硬件组件有关的故障。",
    hardwareProblemExamples: "例如：屏幕出现线条/斑点、部分触控失灵、无法充电、麦克风/扬声器失效、按键损坏。",
    problemHelp: "请用一句话概括最主要的现象，详细过程可在下面填写。",
    problemPlaceholderSoftware: "例如：Wi‑Fi 使用几分钟后会自动断开",
    problemPlaceholderHardware: "例如：屏幕出现绿色线条，右侧区域触控失灵",
    reproduceHelp: "请按步骤描述问题出现前的操作，包括使用的应用/页面以及故障出现前的动作。",
    reproducePlaceholderSoftware: "例如：1. 打开设置 > Wi‑Fi。2. 连接网络。3. 使用手机 2–3 分钟。4. Wi‑Fi 自动断开。",
    reproducePlaceholderHardware: "例如：1. 点亮屏幕。2. 打开任意应用。3. 点击屏幕右侧。4. 该区域没有触控响应。",
    expectedHelp: "请说明设备正常情况下应该如何工作。",
    expectedPlaceholder: "例如：Wi‑Fi 应保持连接，不应中断。",
    carrierHelp: "请输入正在使用的运营商。如果问题与移动网络无关或不适用，请填写“不适用”。",
    carrierPlaceholder: "例如：中国移动 / Claro — 或 不适用",
    collectionTitle: "请在采集过程中复现问题。",
    collectionText: "连接设备后，请开始采集，并在手机上执行会触发故障的相同步骤。问题出现后，返回此页面并结束采集。继续下一步之前，至少需要一份证据文件。",
    evidenceRequired: "继续之前请至少添加一份证据。请完成一次设备采集，或手动上传文件。",
    sendError: "提交未能完成。您的信息仍保留在此页面。请查看下面的错误信息并重试。",
    fileSizeError: "无法添加其中一个文件。每份证据必须包含内容且大小不超过 1 GB。",
  };
  return {
    issueTypePrompt: "First, choose the option that best matches the issue.",
    softwareProblem: "Software issue",
    softwareProblemDesc: "A system, app, or connectivity failure without an obvious physical defect.",
    softwareProblemExamples: "Examples: app crashes, Wi‑Fi/Bluetooth disconnects, device reboots, notifications fail, issue started after an update.",
    hardwareProblem: "Hardware issue",
    hardwareProblemDesc: "A failure involving a physical part or component of the device.",
    hardwareProblemExamples: "Examples: lines/spots on screen, touch area not responding, no charging, microphone/speaker failure, broken button.",
    problemHelp: "Summarize the main symptom in one sentence. You can add the full story below.",
    problemPlaceholderSoftware: "Example: Wi‑Fi disconnects by itself after a few minutes",
    problemPlaceholderHardware: "Example: Green lines appear on the display and touch fails on the right side",
    reproduceHelp: "Describe the steps until the problem appears. Include the app/screen and what you do immediately before the failure.",
    reproducePlaceholderSoftware: "Example: 1. Open Settings > Wi‑Fi. 2. Connect to the network. 3. Use the phone for 2–3 minutes. 4. Wi‑Fi disconnects.",
    reproducePlaceholderHardware: "Example: 1. Turn on the display. 2. Open any app. 3. Touch the right side. 4. Touch does not respond in that area.",
    expectedHelp: "Tell us how the device should normally behave.",
    expectedPlaceholder: "Example: Wi‑Fi should stay connected without interruptions.",
    carrierHelp: "Enter the carrier in use. If the issue is unrelated to mobile service or does not apply, enter “Not applicable”.",
    carrierPlaceholder: "e.g. T-Mobile, AT&T — or Not applicable",
    collectionTitle: "Reproduce the issue while collecting evidence.",
    collectionText: "After connecting the device, start the collection and perform the same steps that trigger the issue on the phone. When it happens, return to this page and finish the collection. At least one evidence file is required before you can continue.",
    evidenceRequired: "Add at least one evidence file before continuing. Complete a device collection or upload a file manually.",
    sendError: "We could not complete the submission. Your information is still on this page. Review the message below and try again.",
    fileSizeError: "One of the files could not be added. Each evidence file must contain data and be no larger than 1 GB.",
  };
}

export default function CustomerIntlV2({ navigate }: { navigate: (p: string) => void }) {
  const { i18n } = useTranslation();
  const copy = uxCopy(i18n.resolvedLanguage || i18n.language || "en");
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>();
  const [copied, setCopied] = useState(false);
  const [postalBusy, setPostalBusy] = useState(false);
  const [postalMessage, setPostalMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [form, setForm] = useState({
    brand: "infinix", model: "", build: "", category: "software", problem: "", description: "", expected: "", carrier: "",
    name: "", email: "", phone: "", country: "Brasil", postalCode: "", street: "", addressNumber: "", addressComplement: "",
    neighborhood: "", city: "", state: "", consent: false,
  });

  const field = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const desktop = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const steps = [tx("device"), tx("issue"), tx("collection"), tx("details")];
  const brazil = /^(brasil|brazil)$/i.test(form.country.trim());
  const hardware = form.category === "hardware";
  const markInvalid = (key: string) => setInvalidFields((current) => current.includes(key) ? current : [...current, key]);
  const clearInvalid = (key: string) => setInvalidFields((current) => current.filter((item) => item !== key));
  const requiredLabel = (label: string) => <>{label} <span aria-hidden="true" style={{ color: "#ff6b81" }}>*</span></>;
  const requiredProps = (key: string) => ({
    required: true,
    "aria-invalid": invalidFields.includes(key) || undefined,
    onInvalid: (event: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) => { event.preventDefault(); markInvalid(key); },
    onFocus: () => clearInvalid(key),
    onClick: () => clearInvalid(key),
    style: invalidFields.includes(key) ? { borderColor: "#ff5c73", boxShadow: "0 0 0 1px rgba(255, 92, 115, 0.28)" } : undefined,
  });
  const help = (text: string) => <small style={{ display: "block", marginTop: 5, lineHeight: 1.5 }}>{text}</small>;

  function prepareMobileGuide() {
    const savedLanguage = localStorage.getItem("aftercare-language");
    const browserLanguage = navigator.language.toLowerCase();
    const language = savedLanguage || (browserLanguage.startsWith("zh") ? "zh-CN" : browserLanguage.startsWith("es") ? "es-419" : browserLanguage.startsWith("pt") ? "pt-BR" : "en");
    let current: any = {};
    try { current = JSON.parse(localStorage.getItem("transsion-guide-session-v2") || "{}"); } catch {}
    localStorage.setItem("transsion-guide-session-v2", JSON.stringify({ ...current, language, countryCode: current.countryCode || "BR", brandId: form.brand, method: "mobile", stage: "guide", guideStep: 0, reachedStep: 0, completed: [] }));
  }

  const addFiles = (incoming: File[]) => {
    if (incoming.some((file) => !file.size || file.size > 1024 ** 3)) { setError(copy.fileSizeError); return; }
    setFiles((current) => [...current, ...incoming]);
    setError("");
  };

  async function lookupPostalCode() {
    if (!brazil) return;
    const digits = form.postalCode.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) { setPostalMessage(tx("postalInvalid")); markInvalid("postalCode"); return; }
    setPostalBusy(true); setPostalMessage("");
    try {
      const data = await api<any>(`/postal/br/${digits}`);
      setForm((current) => ({ ...current, postalCode: formatCep(data.postalCode || digits), street: data.street || current.street, neighborhood: data.neighborhood || current.neighborhood, city: data.city || current.city, state: data.state || current.state, addressComplement: current.addressComplement || data.addressComplement || "" }));
      clearInvalid("postalCode"); setPostalMessage(tx("postalFound"));
    } catch (caught) { markInvalid("postalCode"); setPostalMessage(caught instanceof Error ? caught.message : String(caught)); }
    finally { setPostalBusy(false); }
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      let currentResult = result;
      if (!currentResult) {
        currentResult = await api("/cases", post(form));
        setResult(currentResult);
        sessionStorage.setItem("case-access", JSON.stringify({ id: currentResult.case.id, token: currentResult.accessToken }));
      }
      for (const file of [...files]) {
        await upload(currentResult.case.id, currentResult.accessToken, file);
        setFiles((current) => current.filter((item) => item !== file));
      }
      setStep(4);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : String(caught);
      setError(`${copy.sendError}${detail ? ` ${detail}` : ""}`);
    } finally { setBusy(false); }
  }

  if (step === 4) return <section className="customer-wrap"><div className="success-card"><span className="success-icon"><CheckCircle2 size={44}/></span><h1>{tx("received")}</h1><p>{tx("receivedText")}</p><div className="access-box"><small>{tx("protocol")}</small><strong>{result.case.id}</strong><small>{tx("accessCode")}</small><code>{result.accessToken}</code></div><button className="primary" onClick={async()=>{await navigator.clipboard.writeText(`${result.case.id}\n${result.accessToken}`);setCopied(true);}}><Copy size={17}/>{copied?tx("copied"):tx("copy")}</button><button className="secondary" onClick={()=>navigate("tracking")}>{tx("track")}<ArrowRight size={17}/></button>{error&&<p className="error" role="alert">{error}</p>}</div></section>;

  return <section className="customer-wrap"><div className="intro"><span className="eyebrow">AFTERCARE · TRANSSION</span><h1>{tx("intro")}</h1><p>{tx("introText")}</p></div><div className="customer-layout"><aside className="journey"><span className="eyebrow">AFTERCARE</span>{steps.map((label,index)=><div key={label} className={`journey-step ${step===index?"current":step>index?"done":""}`}><span>{step>index?<Check size={16}/>:String(index+1).padStart(2,"0")}</span><div><strong>{label}</strong></div></div>)}<div className="privacy-note"><ShieldCheck size={20}/><p>Privacy-first diagnostic collection.</p></div></aside>
  <form className="form-card" onSubmit={(event)=>{event.preventDefault();if(step===2&&files.length===0){setError(copy.evidenceRequired);return;}setError("");if(step<3)setStep(step+1);else void submit();}}>
  <div className="step-heading"><span>{tx("step",{n:step+1})}</span><small>{Math.round((step+1)*25)}%</small></div><div className="progress"><i style={{width:`${(step+1)*25}%`}}/></div>
  {step===0&&<><h2>{tx("device")}</h2><div className="brand-options">{["infinix","tecno","itel"].map((brand)=><button type="button" key={brand} className={form.brand===brand?"selected":""} onClick={()=>field("brand",brand)}><img src={`/brandmarks/${brand}.svg`} alt={brand}/><span className="radio-mark">{form.brand===brand&&<Check size={12}/>}</span></button>)}</div><label>{requiredLabel(tx("model"))}<input {...requiredProps("model")} minLength={2} maxLength={100} placeholder={tx("model")} value={form.model} onChange={(e)=>field("model",e.target.value)}/></label><label>{requiredLabel(tx("software"))}<input {...requiredProps("build")} maxLength={180} placeholder={tx("software")} value={form.build} onChange={(e)=>field("build",e.target.value)}/></label></>}
  {step===1&&<><h2>{tx("issue")}</h2><p style={{marginBottom:18}}>{copy.issueTypePrompt}</p><div className="choice-row"><button type="button" className={`option ${form.category==="software"?"selected":""}`} onClick={()=>field("category","software")}><strong>{copy.softwareProblem}</strong><small style={{lineHeight:1.5}}>{copy.softwareProblemDesc}</small><small style={{color:"var(--green)",lineHeight:1.5}}>{copy.softwareProblemExamples}</small></button><button type="button" className={`option ${form.category==="hardware"?"selected":""}`} onClick={()=>field("category","hardware")}><strong>{copy.hardwareProblem}</strong><small style={{lineHeight:1.5}}>{copy.hardwareProblemDesc}</small><small style={{color:"var(--green)",lineHeight:1.5}}>{copy.hardwareProblemExamples}</small></button></div>
  <label>{requiredLabel(tx("problem"))}{help(copy.problemHelp)}<input {...requiredProps("problem")} minLength={5} maxLength={180} placeholder={hardware?copy.problemPlaceholderHardware:copy.problemPlaceholderSoftware} value={form.problem} onChange={(e)=>field("problem",e.target.value)}/></label>
  <label>{requiredLabel(tx("reproduce"))}{help(copy.reproduceHelp)}<textarea {...requiredProps("description")} minLength={15} maxLength={5000} rows={5} placeholder={hardware?copy.reproducePlaceholderHardware:copy.reproducePlaceholderSoftware} value={form.description} onChange={(e)=>field("description",e.target.value)}/></label>
  <label>{requiredLabel(tx("expected"))}{help(copy.expectedHelp)}<input {...requiredProps("expected")} minLength={3} maxLength={1000} placeholder={copy.expectedPlaceholder} value={form.expected} onChange={(e)=>field("expected",e.target.value)}/></label>
  <label>{requiredLabel(tx("carrier"))}{help(copy.carrierHelp)}<input {...requiredProps("carrier")} minLength={2} maxLength={80} placeholder={copy.carrierPlaceholder} value={form.carrier} onChange={(e)=>field("carrier",e.target.value)}/></label></>}
  {step===2&&<><h2>{desktop?tx("captureDesktop"):tx("captureMobile")}</h2><div className="hint" role="note"><ShieldCheck size={20}/><p><strong>{copy.collectionTitle}</strong><br/>{copy.collectionText}</p></div>{desktop?<BrowserCapture onFiles={addFiles} onDeviceInfo={(info)=>setForm((current)=>({...current,brand:["infinix","tecno","itel"].includes(info.brand.toLowerCase())?info.brand.toLowerCase():current.brand,model:info.model||current.model,build:info.build||current.build}))}/>:<a href="/guide" target="_blank" rel="noreferrer" className="guide-link" onClick={prepareMobileGuide}><Smartphone size={28}/><span><small style={{color:"var(--green)",fontWeight:700,letterSpacing:1}}>{tx("mobileGuideBadge")}</small><strong>{tx("mobileGuideTitle")}</strong><small>{tx("mobileGuideDescription")}</small><small style={{color:"var(--green)",marginTop:8}}>{tx("mobileGuideAction")}</small></span><ArrowRight size={18}/></a>}<span className="manual-evidence-title">{tx("manualFiles")}</span><label className="dropzone"><UploadCloud size={34}/><strong>{tx("chooseFiles")}</strong><input type="file" multiple accept=".png,.jpg,.jpeg,.mp4,.txt,.zip,.log,.xml,.prop,.csv" onChange={(e)=>addFiles(Array.from(e.target.files||[]))}/></label>{files.map((file,index)=><div className="file-row" key={`${file.name}-${file.size}-${index}`}><FileText size={18}/><span>{file.name}</span><button type="button" onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))}>{tx("remove")}</button></div>)}</>}
  {step===3&&<><h2>{tx("contactTitle")}</h2><p>{tx("contactText")}</p><label>{requiredLabel(tx("name"))}<input {...requiredProps("name")} autoComplete="name" minLength={2} maxLength={100} placeholder={tx("name")} value={form.name} onChange={(e)=>field("name",e.target.value)}/></label><label>{requiredLabel(tx("email"))}<input {...requiredProps("email")} type="email" autoComplete="email" maxLength={180} placeholder={tx("email")} value={form.email} onChange={(e)=>field("email",e.target.value)}/></label><label>{requiredLabel(tx("phone"))}<input {...requiredProps("phone")} type="tel" autoComplete="tel" minLength={6} maxLength={30} placeholder={tx("phonePlaceholder")} value={form.phone} onChange={(e)=>field("phone",e.target.value)}/></label><label>{requiredLabel(tx("country"))}<input {...requiredProps("country")} minLength={2} maxLength={80} placeholder={tx("country")} value={form.country} onChange={(e)=>{field("country",e.target.value);setPostalMessage("");}}/></label>
  <label>{requiredLabel(tx("postalCode"))}<div style={{display:"flex",gap:10,alignItems:"end"}}><input {...requiredProps("postalCode")} inputMode={brazil?"numeric":"text"} autoComplete="postal-code" maxLength={20} placeholder={tx("postalPlaceholder")} value={form.postalCode} onChange={(e)=>field("postalCode",brazil?formatCep(e.target.value):e.target.value)} onBlur={()=>{if(brazil&&form.postalCode.replace(/\D/g,"").length===8&&!form.street)void lookupPostalCode();}}/>{brazil&&<button type="button" className="secondary" disabled={postalBusy} onClick={()=>void lookupPostalCode()}>{postalBusy?tx("postalSearching"):tx("postalSearch")}</button>}</div>{postalMessage&&<small style={{display:"block",marginTop:6}}>{postalMessage}</small>}</label>
  <label>{requiredLabel(tx("street"))}<input {...requiredProps("street")} autoComplete="address-line1" minLength={2} maxLength={180} placeholder={tx("street")} value={form.street} onChange={(e)=>field("street",e.target.value)}/></label><label>{requiredLabel(tx("number"))}<input {...requiredProps("addressNumber")} maxLength={30} placeholder={tx("number")} value={form.addressNumber} onChange={(e)=>field("addressNumber",e.target.value)}/></label><label>{tx("complement")} <em>{tx("addressOptional")}</em><input autoComplete="address-line2" maxLength={120} placeholder={tx("complement")} value={form.addressComplement} onChange={(e)=>field("addressComplement",e.target.value)}/></label><label>{tx("neighborhood")} <em>{tx("addressOptional")}</em><input maxLength={120} placeholder={tx("neighborhood")} value={form.neighborhood} onChange={(e)=>field("neighborhood",e.target.value)}/></label><label>{requiredLabel(tx("city"))}<input {...requiredProps("city")} autoComplete="address-level2" minLength={2} maxLength={100} placeholder={tx("city")} value={form.city} onChange={(e)=>field("city",e.target.value)}/></label><label>{requiredLabel(tx("state"))}<input {...requiredProps("state")} autoComplete="address-level1" minLength={1} maxLength={100} placeholder={tx("state")} value={form.state} onChange={(e)=>field("state",e.target.value)}/></label><label className="consent" style={invalidFields.includes("consent")?{color:"#ff8093"}:undefined}><input required type="checkbox" checked={form.consent} onInvalid={(e)=>{e.preventDefault();markInvalid("consent");}} onClick={()=>clearInvalid("consent")} onChange={(e)=>field("consent",e.target.checked)}/><span>{tx("consent")}</span></label></>}
  {error&&<p className="error" role="alert" aria-live="assertive">{error}</p>}<div className="form-actions">{step>0?<button type="button" className="text-action" onClick={()=>{setError("");setStep(step-1);}}><ArrowLeft size={17}/>{tx("back")}</button>:<small>Aftercare</small>}<button className="primary" disabled={busy||postalBusy}>{busy?tx("sending"):step===3?tx("submit"):tx("continue")}</button></div>
  </form></div></section>;
}
