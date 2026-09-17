import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Cable, Check, CheckCircle2, Copy, FileText, RotateCcw, ShieldCheck, Smartphone, UploadCloud } from "lucide-react";
import TrackedBrowserCapture from "./TrackedBrowserCapture";
import HardwareCollection, { hardwareCollectionCopy } from "./HardwareCollection";
import { api, post, upload } from "./api";
import { portalText as tx } from "./portal-i18n";

type CollectionMethod = "mobile" | "browser" | null;
type CaseResult = { case: { id: string }; accessToken: string };

type FlowForm = {
  brand: string; model: string; build: string; category: "software" | "hardware"; problem: string; description: string; expected: string; carrier: string;
  name: string; email: string; phone: string; country: string; postalCode: string; street: string; addressNumber: string; addressComplement: string;
  neighborhood: string; city: string; state: string; consent: boolean;
};

const copyFor = (language: string) => {
  if (language.startsWith("pt")) return {
    issueTypePrompt: "Primeiro, escolha a opção que mais se parece com o problema.", softwareProblem: "Problema de software", hardwareProblem: "Problema de hardware",
    softwareProblemDesc: "Falha no sistema, aplicativo ou conexão, sem dano físico aparente.", hardwareProblemDesc: "Falha em uma peça ou componente físico do aparelho.",
    modelHelp: "Informe o nome comercial ou o código do modelo que aparece no aparelho.", softwareHelp: "Em Configurações, copie o número da versão/software exibido no aparelho.",
    problemHelp: "Resuma em uma frase o principal sintoma.", reproduceHelp: "Observações e passos são opcionais e não têm quantidade mínima de caracteres.", expectedHelp: "Explique como o aparelho deveria se comportar normalmente.", carrierHelp: "Informe a operadora. Se não se aplicar, escreva “Não se aplica”.",
    chooseMethodTitle: "Como você quer fazer a coleta?", chooseMethodText: "Para software, escolha uma opção. Você pode reiniciar esta etapa antes de enviar o caso.", noComputerBadge: "SEM COMPUTADOR", noComputerTitle: "Usar apenas o celular", noComputerDescription: "Siga o guia no celular e envie os arquivos manualmente.", noComputerGuide: "Abrir guia completo no celular", browserBadge: "COMPUTADOR / NAVEGADOR", browserTitle: "Coleta direta pelo navegador", browserDescription: "Conecte o aparelho por USB. As evidências serão anexadas automaticamente ao finalizar.", browserUnavailable: "Esta opção precisa de computador, navegador compatível e USB.", resetCollection: "Reiniciar", resetBlocked: "Finalize ou cancele a coleta atual antes de reiniciar.", evidenceRequired: "Adicione pelo menos uma evidência antes de continuar.", methodRequired: "Escolha primeiro como fará a coleta.", automaticEvidence: "Coleta concluída e evidências anexadas automaticamente.", softwareContactText: "Para software, precisamos somente de nome, e-mail e telefone.", hardwareContactText: "Para hardware, precisamos dos dados completos para associação do aparelho e eventual garantia.", sendError: "Não foi possível concluir o envio. Seus dados continuam nesta tela.", fileSizeError: "Cada evidência precisa ter conteúdo e no máximo 1 GB.", privacyNote: "Coleta de diagnóstico com foco em privacidade.", filesLabel: "arquivo(s)",
  };
  if (language.startsWith("es")) return {
    issueTypePrompt: "Primero, elige la opción que más se parezca al problema.", softwareProblem: "Problema de software", hardwareProblem: "Problema de hardware",
    softwareProblemDesc: "Falla del sistema, una aplicación o conexión, sin daño físico evidente.", hardwareProblemDesc: "Falla relacionada con una pieza o componente físico del dispositivo.",
    modelHelp: "Indica el nombre comercial o el código de modelo del dispositivo.", softwareHelp: "En Ajustes, copia el número de versión/software mostrado en el dispositivo.",
    problemHelp: "Resume el síntoma principal en una frase.", reproduceHelp: "Las observaciones y los pasos son opcionales y no tienen una cantidad mínima de caracteres.", expectedHelp: "Explica cómo debería funcionar normalmente el dispositivo.", carrierHelp: "Indica el operador. Si no aplica, escribe “No aplica”.",
    chooseMethodTitle: "¿Cómo quieres hacer la recopilación?", chooseMethodText: "Para software, elige una opción. Puedes reiniciar este paso antes de enviar el caso.", noComputerBadge: "SIN COMPUTADORA", noComputerTitle: "Usar solo el celular", noComputerDescription: "Sigue la guía en el celular y carga los archivos manualmente.", noComputerGuide: "Abrir la guía completa en el celular", browserBadge: "COMPUTADORA / NAVEGADOR", browserTitle: "Recopilación directa desde el navegador", browserDescription: "Conecta el dispositivo por USB. Las evidencias se adjuntarán automáticamente al finalizar.", browserUnavailable: "Esta opción requiere computadora, navegador compatible y USB.", resetCollection: "Reiniciar", resetBlocked: "Finaliza o cancela la recopilación actual antes de reiniciar.", evidenceRequired: "Agrega al menos una evidencia antes de continuar.", methodRequired: "Primero elige cómo harás la recopilación.", automaticEvidence: "Recopilación finalizada y evidencias adjuntadas automáticamente.", softwareContactText: "Para software, solo necesitamos nombre, correo electrónico y teléfono.", hardwareContactText: "Para hardware, necesitamos los datos completos para asociar el dispositivo y una posible garantía.", sendError: "No fue posible completar el envío. Tus datos permanecen en esta pantalla.", fileSizeError: "Cada evidencia debe tener contenido y un máximo de 1 GB.", privacyNote: "Recopilación de diagnóstico centrada en la privacidad.", filesLabel: "archivo(s)",
  };
  if (language.startsWith("zh")) return {
    issueTypePrompt: "请先选择最符合当前问题的类型。", softwareProblem: "软件问题", hardwareProblem: "硬件问题",
    softwareProblemDesc: "系统、应用或连接异常，且没有明显物理损坏。", hardwareProblemDesc: "与设备实体零件或硬件组件有关的故障。",
    modelHelp: "请输入设备的商品名称或型号代码。", softwareHelp: "请在设置中复制设备显示的版本/软件编号。",
    problemHelp: "请用一句话概括主要现象。", reproduceHelp: "补充说明和操作步骤为可选项，没有最少字符数限制。", expectedHelp: "请说明设备正常情况下应该如何工作。", carrierHelp: "请输入运营商；如不适用，请填写“不适用”。",
    chooseMethodTitle: "您希望如何进行采集？", chooseMethodText: "软件问题请选择一种采集方式。提交前可以重新开始此步骤。", noComputerBadge: "无需电脑", noComputerTitle: "仅使用手机", noComputerDescription: "请在手机上按照指南操作并手动上传文件。", noComputerGuide: "在手机上打开完整指南", browserBadge: "电脑 / 浏览器", browserTitle: "浏览器直接采集", browserDescription: "通过 USB 连接设备。结束后证据会自动附加。", browserUnavailable: "此方式需要电脑、兼容浏览器和 USB。", resetCollection: "重新开始", resetBlocked: "请先结束或取消当前采集，再重新开始。", evidenceRequired: "继续之前请至少添加一份证据。", methodRequired: "请先选择采集方式。", automaticEvidence: "采集完成，证据已自动附加。", softwareContactText: "软件问题只需要姓名、电子邮箱和电话。", hardwareContactText: "硬件问题需要完整信息，以便关联设备并处理可能的保修。", sendError: "提交未完成。您的数据仍保留在此页面。", fileSizeError: "每份证据必须包含内容且大小不超过 1 GB。", privacyNote: "以隐私保护为核心的诊断采集。", filesLabel: "个文件",
  };
  return {
    issueTypePrompt: "First, choose the option that best matches the issue.", softwareProblem: "Software issue", hardwareProblem: "Hardware issue",
    softwareProblemDesc: "A system, app, or connectivity failure without an obvious physical defect.", hardwareProblemDesc: "A failure involving a physical part or component of the device.",
    modelHelp: "Enter the commercial device name or model code.", softwareHelp: "In Settings, copy the version/software number shown on the device.",
    problemHelp: "Summarize the main symptom in one sentence.", reproduceHelp: "Notes and reproduction steps are optional and have no minimum character requirement.", expectedHelp: "Tell us how the device should normally behave.", carrierHelp: "Enter the carrier. If it does not apply, enter “Not applicable”.",
    chooseMethodTitle: "How do you want to collect evidence?", chooseMethodText: "For software, choose one method. You can restart this step before submitting the case.", noComputerBadge: "NO COMPUTER", noComputerTitle: "Use only the phone", noComputerDescription: "Follow the guide on the phone and upload the files manually.", noComputerGuide: "Open the complete mobile guide", browserBadge: "COMPUTER / BROWSER", browserTitle: "Direct browser collection", browserDescription: "Connect the device over USB. Evidence is attached automatically when collection finishes.", browserUnavailable: "This option requires a computer, compatible browser, and USB.", resetCollection: "Restart", resetBlocked: "Finish or cancel the current collection before restarting.", evidenceRequired: "Add at least one evidence file before continuing.", methodRequired: "Choose how you want to collect evidence first.", automaticEvidence: "Collection complete and evidence attached automatically.", softwareContactText: "For software, we only need your name, email, and phone number.", hardwareContactText: "For hardware, we need complete details to associate the device and handle a possible warranty case.", sendError: "We could not complete the submission. Your data remains on this screen.", fileSizeError: "Each evidence file must contain data and be no larger than 1 GB.", privacyNote: "Privacy-first diagnostic collection.", filesLabel: "file(s)",
  };
};

function formatCep(value: string) { const digits = value.replace(/\D/g, "").slice(0, 8); return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits; }

export default function CustomerFlowV2({ navigate }: { navigate: (p: string) => void }) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const copy = copyFor(language);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>(null);
  const [browserBusy, setBrowserBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [postalBusy, setPostalBusy] = useState(false);
  const [postalMessage, setPostalMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [form, setForm] = useState<FlowForm>({ brand: "infinix", model: "", build: "", category: "software", problem: "", description: "", expected: "", carrier: "", name: "", email: "", phone: "", country: "Brasil", postalCode: "", street: "", addressNumber: "", addressComplement: "", neighborhood: "", city: "", state: "", consent: false });

  const hardware = form.category === "hardware";
  const desktop = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const brazil = /^(brasil|brazil)$/i.test(form.country.trim());
  const steps = [tx("device"), tx("issue"), tx("collection"), tx("details")];
  const hardwareCopy = hardwareCollectionCopy(language, tx("chooseFiles"), tx("remove"));
  const field = <K extends keyof FlowForm>(key: K, value: FlowForm[K]) => setForm(current => ({ ...current, [key]: value }));
  const markInvalid = (key: string) => setInvalidFields(current => current.includes(key) ? current : [...current, key]);
  const clearInvalid = (key: string) => setInvalidFields(current => current.filter(item => item !== key));
  const help = (text: string) => <small style={{display:"block",marginTop:5,lineHeight:1.5}}>{text}</small>;
  const requiredLabel = (label: string) => <>{label} <span aria-hidden="true" style={{color:"#ff6b81"}}>*</span></>;
  const requiredProps = (key: string) => ({ required: true, "aria-invalid": invalidFields.includes(key) || undefined, onInvalid: (event: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) => { event.preventDefault(); markInvalid(key); }, onFocus: () => clearInvalid(key), onClick: () => clearInvalid(key) });

  const filesAreValid = (incoming: File[]) => {
    if (incoming.some(file => !file.size || file.size > 1024 ** 3)) { setError(copy.fileSizeError); return false; }
    return true;
  };
  const addFiles = (incoming: File[]) => { if (!filesAreValid(incoming)) return; setFiles(current => [...current, ...incoming]); setError(""); };
  const removeFile = (index: number) => setFiles(current => current.filter((_, i) => i !== index));
  const handleBrowserFiles = (incoming: File[]) => { if (!incoming.length || !filesAreValid(incoming)) return; setFiles(incoming); setError(""); setStep(3); };
  const resetCollection = () => { if (browserBusy) { setError(copy.resetBlocked); return; } setCollectionMethod(null); setFiles([]); setError(""); };

  function prepareMobileGuide() {
    const savedLanguage = localStorage.getItem("aftercare-language");
    const browserLanguage = navigator.language.toLowerCase();
    const resolved = savedLanguage || language || (browserLanguage.startsWith("zh") ? "zh-CN" : browserLanguage.startsWith("es") ? "es-419" : browserLanguage.startsWith("pt") ? "pt-BR" : "en");
    let current: Record<string, unknown> = {};
    try { current = JSON.parse(localStorage.getItem("transsion-guide-session-v2") || "{}"); } catch { current = {}; }
    localStorage.setItem("transsion-guide-session-v2", JSON.stringify({ ...current, language: resolved, countryCode: current.countryCode || "BR", brandId: form.brand, method: "mobile", stage: "guide", guideStep: 0, reachedStep: 0, completed: [] }));
  }

  async function lookupPostalCode() {
    if (!hardware || !brazil) return;
    const digits = form.postalCode.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) { setPostalMessage(tx("postalInvalid")); markInvalid("postalCode"); return; }
    setPostalBusy(true); setPostalMessage("");
    try {
      const data = await api<Record<string, string>>(`/postal/br/${digits}`);
      setForm(current => ({ ...current, postalCode: formatCep(data.postalCode || digits), street: data.street || current.street, neighborhood: data.neighborhood || current.neighborhood, city: data.city || current.city, state: data.state || current.state, addressComplement: current.addressComplement || data.addressComplement || "" }));
      clearInvalid("postalCode"); setPostalMessage(tx("postalFound"));
    } catch (caught) { markInvalid("postalCode"); setPostalMessage(caught instanceof Error ? caught.message : String(caught)); }
    finally { setPostalBusy(false); }
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      let currentResult = result;
      if (!currentResult) {
        const payload = hardware ? form : { ...form, country: "", postalCode: "", street: "", addressNumber: "", addressComplement: "", neighborhood: "", city: "", state: "" };
        currentResult = await api<CaseResult>("/cases", post(payload));
        setResult(currentResult);
        sessionStorage.setItem("case-access", JSON.stringify({ id: currentResult.case.id, token: currentResult.accessToken }));
      }
      for (const file of [...files]) { await upload(currentResult.case.id, currentResult.accessToken, file); setFiles(current => current.filter(item => item !== file)); }
      setStep(4);
    } catch (caught) { const detail = caught instanceof Error ? caught.message : String(caught); setError(`${copy.sendError}${detail ? ` ${detail}` : ""}`); }
    finally { setBusy(false); }
  }

  const advance = () => {
    if (step === 2) {
      if (hardware && files.length === 0) { setError(copy.evidenceRequired); return; }
      if (!hardware && !collectionMethod) { setError(copy.methodRequired); return; }
      if (!hardware && files.length === 0) { setError(copy.evidenceRequired); return; }
    }
    setError("");
    if (step < 3) setStep(step + 1); else void submit();
  };

  if (step === 4 && result) return <section className="customer-wrap"><div className="success-card"><span className="success-icon"><CheckCircle2 size={44}/></span><h1>{tx("received")}</h1><p>{tx("receivedText")}</p><div className="access-box"><small>{tx("protocol")}</small><strong>{result.case.id}</strong><small>{tx("accessCode")}</small><code>{result.accessToken}</code></div><button className="primary" onClick={async()=>{await navigator.clipboard.writeText(`${result.case.id}\n${result.accessToken}`);setCopied(true);}}><Copy size={17}/>{copied?tx("copied"):tx("copy")}</button><button className="secondary" onClick={()=>navigate("tracking")}>{tx("track")}<ArrowRight size={17}/></button>{error&&<p className="error" role="alert">{error}</p>}</div></section>;

  const showPrimary = step !== 2 || hardware || collectionMethod === "mobile" || (collectionMethod === "browser" && files.length > 0);

  return <section className="customer-wrap"><div className="intro"><span className="eyebrow">AFTERCARE · TRANSSION</span><h1>{tx("intro")}</h1><p>{tx("introText")}</p></div><div className="customer-layout"><aside className="journey"><span className="eyebrow">AFTERCARE</span>{steps.map((label,index)=><div key={label} className={`journey-step ${step===index?"current":step>index?"done":""}`}><span>{step>index?<Check size={16}/>:String(index+1).padStart(2,"0")}</span><div><strong>{label}</strong></div></div>)}<div className="privacy-note"><ShieldCheck size={20}/><p>{copy.privacyNote}</p></div></aside>
  <form className="form-card" onSubmit={(event)=>{event.preventDefault();advance();}}>
  <div className="step-heading"><span>{tx("step",{n:step+1})}</span><small>{Math.round((step+1)*25)}%</small></div><div className="progress"><i style={{width:`${(step+1)*25}%`}}/></div>

  {step===0&&<><h2>{tx("device")}</h2><div className="brand-options">{["infinix","tecno","itel"].map(brand=><button type="button" key={brand} className={form.brand===brand?"selected":""} onClick={()=>field("brand",brand)}><img src={`/brandmarks/${brand}.svg`} alt={brand}/><span className="radio-mark">{form.brand===brand&&<Check size={12}/>}</span></button>)}</div><label>{requiredLabel(tx("model"))}{help(copy.modelHelp)}<input {...requiredProps("model")} minLength={2} maxLength={100} value={form.model} onChange={e=>field("model",e.target.value)}/></label><label>{requiredLabel(tx("software"))}{help(copy.softwareHelp)}<input {...requiredProps("build")} maxLength={180} value={form.build} onChange={e=>field("build",e.target.value)}/></label></>}

  {step===1&&<><h2>{tx("issue")}</h2><p style={{marginBottom:18}}>{copy.issueTypePrompt}</p><div className="choice-row"><button type="button" className={`option ${form.category==="software"?"selected":""}`} onClick={()=>{field("category","software");setFiles([]);setCollectionMethod(null);}}><strong>{copy.softwareProblem}</strong><small>{copy.softwareProblemDesc}</small></button><button type="button" className={`option ${hardware?"selected":""}`} onClick={()=>{field("category","hardware");setFiles([]);setCollectionMethod(null);}}><strong>{copy.hardwareProblem}</strong><small>{copy.hardwareProblemDesc}</small></button></div><label>{requiredLabel(tx("problem"))}{help(copy.problemHelp)}<input {...requiredProps("problem")} minLength={5} maxLength={180} value={form.problem} onChange={e=>field("problem",e.target.value)}/></label><label>{tx("reproduce")} <em>{tx("optional")}</em>{help(copy.reproduceHelp)}<textarea rows={5} value={form.description} onChange={e=>field("description",e.target.value)}/></label><label>{requiredLabel(tx("expected"))}{help(copy.expectedHelp)}<input {...requiredProps("expected")} minLength={3} maxLength={1000} value={form.expected} onChange={e=>field("expected",e.target.value)}/></label><label>{requiredLabel(tx("carrier"))}{help(copy.carrierHelp)}<input {...requiredProps("carrier")} minLength={2} maxLength={80} value={form.carrier} onChange={e=>field("carrier",e.target.value)}/></label></>}

  {step===2&&<>{hardware ? <HardwareCollection copy={hardwareCopy} files={files} onFiles={addFiles} onRemove={removeFile}/> : <><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><h2 style={{margin:0}}>{copy.chooseMethodTitle}</h2><button type="button" className="secondary" disabled={!collectionMethod||browserBusy} onClick={resetCollection}><RotateCcw size={16}/>{copy.resetCollection}</button></div><p>{copy.chooseMethodText}</p>{!collectionMethod&&<div className="choice-row"><button type="button" className="option" onClick={()=>{setCollectionMethod("mobile");setFiles([]);}}><Smartphone size={26}/><small>{copy.noComputerBadge}</small><strong>{copy.noComputerTitle}</strong><small>{copy.noComputerDescription}</small></button><button type="button" className="option" disabled={!desktop} onClick={()=>desktop&&setCollectionMethod("browser")}><Cable size={26}/><small>{copy.browserBadge}</small><strong>{copy.browserTitle}</strong><small>{desktop?copy.browserDescription:copy.browserUnavailable}</small></button></div>}{collectionMethod==="mobile"&&<><a href="/guide" target="_blank" rel="noreferrer" className="guide-link" onClick={prepareMobileGuide}><Smartphone size={28}/><span><small>{copy.noComputerBadge}</small><strong>{copy.noComputerGuide}</strong><small>{copy.noComputerDescription}</small></span><ArrowRight size={18}/></a><span className="manual-evidence-title">{tx("manualFiles")}</span><label className="dropzone"><UploadCloud size={34}/><strong>{tx("chooseFiles")}</strong><input type="file" multiple accept=".png,.jpg,.jpeg,.mp4,.txt,.zip,.log,.xml,.prop,.csv" onChange={e=>addFiles(Array.from(e.target.files||[]))}/></label>{files.map((file,index)=><div className="file-row" key={`${file.name}-${file.size}-${index}`}><FileText size={18}/><span>{file.name}</span><button type="button" onClick={()=>removeFile(index)}>{tx("remove")}</button></div>)}</>}{collectionMethod==="browser"&&files.length===0&&<TrackedBrowserCapture onBusyChange={setBrowserBusy} onFiles={handleBrowserFiles} onDeviceInfo={info=>setForm(current=>({...current,brand:["infinix","tecno","itel"].includes(info.brand.toLowerCase())?info.brand.toLowerCase():current.brand,model:info.model||current.model,build:info.build||current.build}))}/>} {collectionMethod==="browser"&&files.length>0&&<div className="usb-complete"><ShieldCheck size={22}/><div><strong>{copy.automaticEvidence}</strong><small>{files.length} {copy.filesLabel}</small></div></div>}</>}</>}

  {step===3&&<><h2>{tx("contactTitle")}</h2><p>{hardware?copy.hardwareContactText:copy.softwareContactText}</p><label>{requiredLabel(tx("name"))}<input {...requiredProps("name")} autoComplete="name" minLength={2} maxLength={100} value={form.name} onChange={e=>field("name",e.target.value)}/></label><label>{requiredLabel(tx("email"))}<input {...requiredProps("email")} type="email" autoComplete="email" maxLength={180} value={form.email} onChange={e=>field("email",e.target.value)}/></label><label>{requiredLabel(tx("phone"))}<input {...requiredProps("phone")} type="tel" autoComplete="tel" minLength={6} maxLength={30} value={form.phone} onChange={e=>field("phone",e.target.value)}/></label>{hardware&&<><label>{requiredLabel(tx("country"))}<input {...requiredProps("country")} minLength={2} maxLength={80} value={form.country} onChange={e=>{field("country",e.target.value);setPostalMessage("");}}/></label><label>{requiredLabel(tx("postalCode"))}<div style={{display:"flex",gap:10,alignItems:"end"}}><input {...requiredProps("postalCode")} inputMode={brazil?"numeric":"text"} autoComplete="postal-code" maxLength={20} value={form.postalCode} onChange={e=>field("postalCode",brazil?formatCep(e.target.value):e.target.value)} onBlur={()=>{if(brazil&&form.postalCode.replace(/\D/g,"").length===8&&!form.street)void lookupPostalCode();}}/>{brazil&&<button type="button" className="secondary" disabled={postalBusy} onClick={()=>void lookupPostalCode()}>{postalBusy?tx("postalSearching"):tx("postalSearch")}</button>}</div>{postalMessage&&<small>{postalMessage}</small>}</label><label>{requiredLabel(tx("street"))}<input {...requiredProps("street")} minLength={2} maxLength={180} value={form.street} onChange={e=>field("street",e.target.value)}/></label><label>{requiredLabel(tx("number"))}<input {...requiredProps("addressNumber")} maxLength={30} value={form.addressNumber} onChange={e=>field("addressNumber",e.target.value)}/></label><label>{tx("complement")} <em>{tx("addressOptional")}</em><input maxLength={120} value={form.addressComplement} onChange={e=>field("addressComplement",e.target.value)}/></label><label>{tx("neighborhood")} <em>{tx("addressOptional")}</em><input maxLength={120} value={form.neighborhood} onChange={e=>field("neighborhood",e.target.value)}/></label><label>{requiredLabel(tx("city"))}<input {...requiredProps("city")} minLength={2} maxLength={100} value={form.city} onChange={e=>field("city",e.target.value)}/></label><label>{requiredLabel(tx("state"))}<input {...requiredProps("state")} minLength={1} maxLength={100} value={form.state} onChange={e=>field("state",e.target.value)}/></label></>}<label className="consent"><input required type="checkbox" checked={form.consent} onInvalid={e=>{e.preventDefault();markInvalid("consent");}} onChange={e=>field("consent",e.target.checked)}/><span>{tx("consent")}</span></label></>}

  {error&&<p className="error" role="alert" aria-live="assertive">{error}</p>}<div className="form-actions">{step>0?<button type="button" className="text-action" disabled={step===2&&browserBusy} onClick={()=>{if(step===2&&browserBusy){setError(copy.resetBlocked);return;}setError("");setStep(step-1);}}><ArrowLeft size={17}/>{tx("back")}</button>:<small>Aftercare</small>}{showPrimary&&<button className="primary" disabled={busy||postalBusy}>{busy?tx("sending"):step===3?tx("submit"):tx("continue")}</button>}</div>
  </form></div></section>;
}
