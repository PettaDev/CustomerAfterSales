import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCopy, Cpu, HelpCircle, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { chipsetGuideCopy, chipsetGuideSteps, type Chipset } from "./guides/chipset-mobile";
import { getChipsetVideo } from "./guides/chipset-videos";
import "./chipset-guide.css";

const PLATFORMS: Chipset[] = ["mediatek", "qualcomm", "unisoc"];
const messages = {
  pt: { videoLabel:"Tutorial em vídeo", videoNote:"Acompanhe os passos no vídeo e utilize as instruções escritas abaixo.", command:"Comando para Termux", copy:"Copiar comando", copied:"Copiado", accessibility:"Selecione a plataforma", expand:"Ampliar captura de tela", restriction:"Pode exigir permissão de sistema", confidential:"Evite compartilhar senhas, contatos ou informações particulares", help:"Pedir ajuda ao suporte" },
  en: { videoLabel:"Video tutorial", videoNote:"Follow the video and the written instructions below.", command:"Termux command", copy:"Copy command", copied:"Copied", accessibility:"Select chipset", expand:"Open full-size screenshot", restriction:"May require system permissions", confidential:"Do not share passwords, contacts or private information", help:"Ask support for help" },
  es: { videoLabel:"Tutorial en vídeo", videoNote:"Sigue el vídeo y las instrucciones escritas a continuación.", command:"Comando para Termux", copy:"Copiar comando", copied:"Copiado", accessibility:"Seleccionar procesador", expand:"Ampliar captura", restriction:"Puede requerir permisos del sistema", confidential:"No compartas contraseñas, contactos ni datos privados", help:"Solicitar ayuda al soporte" },
  zh: { videoLabel:"视频教程", videoNote:"请结合视频和下方文字操作步骤。", command:"Termux 命令", copy:"复制命令", copied:"已复制", accessibility:"选择处理器", expand:"打开原始截图", restriction:"可能需要系统权限", confidential:"请勿分享密码、联系人或私人信息", help:"联系支持团队" },
};
const locale = (language: string) => language.startsWith("pt") ? "pt" : language.startsWith("es") ? "es" : language.startsWith("zh") ? "zh" : "en";
const contentImg = (index: number) => ({
  1:"/screenshots/debuglogger/developer-build-number.jpeg",
  2:"/screenshots/termux/termux-play-store.png",
  3:"/screenshots/termux/termux-split-screen-menu.png",
} as Record<number, string>)[index];

export default function ChipsetGuideApp() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "pt-BR";
  const copy = chipsetGuideCopy(language);
  const extra = messages[locale(language)];
  const [chipset, setChipset] = useState<Chipset | null>(null);
  const [step, setStep] = useState(0);
  const [unknown, setUnknown] = useState(false);
  const [copied, setCopied] = useState(false);
  const steps = useMemo(() => chipset ? chipsetGuideSteps(language, chipset) : [], [language, chipset]);

  useEffect(() => {
    document.title = copy.app + " | BRTE";
    return () => { document.title = "BRTE"; };
  }, [copy.app]);
  const selectChipset = (selected: Chipset) => {
    setChipset(selected);
    setStep(0);
    setUnknown(false);
    window.scrollTo({ top: 0, behavior:"smooth" });
  };
  const changeStep = (value: number) => {
    setStep(Math.min(Math.max(value, 0), steps.length - 1));
    window.scrollTo({ top: 0, behavior:"smooth" });
  };
  const copyCommand = (value: string) => {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  const current = steps[step];
  const video = chipset ? getChipsetVideo(chipset, step) : undefined;
  return (
    <div className="brte-chipset-guide">
      {!chipset ? (
        <main className="chipset-choice">
          <span className="chipset-eyebrow"><Cpu size={16}/>{copy.app}</span>
          <h1>{copy.choose}</h1>
          <p className="chipset-lead">{copy.subtitle}</p>
          <p className="chipset-disclaimer"><HelpCircle size={20} aria-hidden="true" />{copy.warning}</p>
          <div className="chipset-cards" role="group" aria-label={extra.accessibility}>
            {PLATFORMS.map(id=>(
              <button key={id} type="button" className="chipset-card" onClick={()=>selectChipset(id)}>
                <span className="chipset-icon"><Cpu size={25} aria-hidden="true"/></span>
                <strong>{copy.chips[id]}</strong>
                <small>{copy.app}</small>
                <ArrowRight size={21} className="chipset-arrow" aria-hidden="true"/>
              </button>
            ))}
          </div>
          <button type="button" className="chipset-unknown" onClick={()=>setUnknown(!unknown)} aria-expanded={unknown}><HelpCircle size={18}/>{copy.unknown}</button>
          {unknown&&<p className="chipset-unknown-answer" role="status">{copy.unknownInfo}</p>}
          <p className="chipset-safety"><ShieldCheck size={18}/>{copy.note}</p>
        </main>
      ) : (
        <main className="chipset-guide-layout">
          <aside className="chipset-sidebar">
            <button type="button" className="chipset-back" onClick={()=>{setChipset(null);setStep(0);}}><ArrowLeft size={17}/>{copy.switch}</button>
            <strong className="chipset-current">{copy.chips[chipset]}</strong>
            <span className="chipset-side-label">{copy.stepsLabel}</span>
            <nav className="chipset-step-list" aria-label={copy.stepsLabel}>
              {steps.map((item,index)=>(
                <button type="button" key={index} className={step===index?"is-current":""} aria-current={step===index?"step":undefined} onClick={()=>changeStep(index)}>
                  <span className="chipset-step-number">{index+1}</span><span>{item.title}</span>
                </button>
              ))}
            </nav>
          </aside>
          <article className="chipset-reading">
            <div className="chipset-breadcrumb"><button type="button" onClick={()=>setChipset(null)}>{copy.app}</button><span>›</span><strong>{copy.chips[chipset]}</strong><span className="chipset-counter">{copy.stage} {step+1}/{steps.length}</span></div>
            <div className="chipset-progress" role="progressbar" aria-valuenow={step+1} aria-valuemax={steps.length} aria-valuemin={0}><span style={{width:((step+1)/steps.length*100)+"%"}}/></div>
            <span className="chipset-eyebrow">{copy.chips[chipset]}</span>
            <h1>{current.title}</h1>
            <p className="chipset-lead">{current.description}</p>
            {video && <section className="chipset-process-video" aria-label={video.title}>
              <div className="chipset-process-video-heading"><span className="chipset-eyebrow">{extra.videoLabel}</span><h2>{video.title}</h2><p>{extra.videoNote}</p></div>
              <video src={video.src} controls playsInline preload="metadata" aria-label={video.title} />
            </section>}
            {step===0&&<div className="chipset-disclaimer"><ShieldCheck size={22}/>{copy.tip}</div>}
            <ol className="chipset-instructions">
              {current.items.map((item,index)=><li key={index}><span>{index+1}</span><p>{item}</p></li>)}
            </ol>
            {contentImg(step)&&<a className="chipset-image" href={contentImg(step)} target="_blank" rel="noopener noreferrer"><img alt={current.title} loading="lazy" src={contentImg(step)} /><span>{extra.expand} ↗</span></a>}
            {current.code&&<div className="chipset-code">
              <div><span>{extra.command}</span><button type="button" onClick={()=>copyCommand(current.code!)}><ClipboardCopy size={16}/>{copied?extra.copied:extra.copy}</button></div>
              <pre><code>{current.code}</code></pre>
            </div>}
            {step===8&&<div className="chipset-note chipset-restricted"><strong>{extra.restriction}</strong><p>{copy.fallback}</p><span>{copy.generic}</span>
              <div className="chipset-code"><div><span>{extra.command}</span><button type="button" onClick={()=>copyCommand("adb logcat -d > ~/storage/downloads/BRTE-logcat.txt")}><ClipboardCopy size={15}/>{extra.copy}</button></div><pre><code>adb logcat -d &gt; ~/storage/downloads/BRTE-logcat.txt</code></pre></div>
            </div>}
            {step===9&&<div className="chipset-disclaimer"><Check size={21}/>{copy.success}</div>}
            <div className="chipset-note"><ShieldCheck size={18}/><span>{copy.support}</span></div>
            <p className="chipset-safety">{extra.confidential}</p>
            <nav className="chipset-navigation">
              <button type="button" onClick={()=>changeStep(step-1)} disabled={step===0}><ArrowLeft size={18}/>{copy.previous}</button>
              <button type="button" className="chipset-next" onClick={()=>step===steps.length-1?setChipset(null):changeStep(step+1)}>{step===steps.length-1?copy.done:copy.next}<ArrowRight size={18}/></button>
            </nav>
          </article>
        </main>
      )}
    </div>
  );
}
