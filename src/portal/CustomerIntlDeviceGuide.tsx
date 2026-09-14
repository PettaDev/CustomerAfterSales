import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Smartphone, UploadCloud, X } from "lucide-react";
import CustomerIntlV2 from "./CustomerIntlV2";
import { portalText as tx } from "./portal-i18n";

type DeviceCopy = {
  modelHelp: string;
  modelPlaceholder: string;
  softwareHelp: string;
  softwarePlaceholder: string;
};

type MobileFlowCopy = {
  badge: string;
  title: string;
  description: string;
  action: string;
  modalTitle: string;
  modalIntro: string;
  steps: string[];
  returnText: string;
  openGuide: string;
  close: string;
};

function deviceCopy(language: string): DeviceCopy {
  if (language.startsWith("pt")) return {
    modelHelp: "Informe o nome comercial ou o código do modelo que aparece no aparelho.",
    modelPlaceholder: "Ex.: Infinix GT 30 Pro (X6873)",
    softwareHelp: "No aparelho, acesse Configurações > Modelo > Número da Versão e copie o número exibido.",
    softwarePlaceholder: "Ex.: X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
  if (language.startsWith("es")) return {
    modelHelp: "Indica el nombre comercial o el código de modelo que aparece en el dispositivo.",
    modelPlaceholder: "Ej.: Infinix GT 30 Pro (X6873)",
    softwareHelp: "En el dispositivo, ve a Ajustes > Modelo > Número de versión y copia el número mostrado.",
    softwarePlaceholder: "Ej.: X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
  if (language.startsWith("zh")) return {
    modelHelp: "请输入设备上显示的商品名称或型号代码。",
    modelPlaceholder: "例如：Infinix GT 30 Pro (X6873)",
    softwareHelp: "请在设备中打开 设置 > 型号 > 版本号，并复制显示的版本号。",
    softwarePlaceholder: "例如：X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
  return {
    modelHelp: "Enter the commercial device name or model code shown on the phone.",
    modelPlaceholder: "e.g. Infinix GT 30 Pro (X6873)",
    softwareHelp: "On the device, open Settings > Model > Version number and copy the version shown.",
    softwarePlaceholder: "e.g. X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
}

function mobileFlowCopy(language: string): MobileFlowCopy {
  if (language.startsWith("pt")) return {
    badge: "SEM COMPUTADOR",
    title: "Fazer a coleta usando apenas o celular",
    description: "Use este caminho se você não tem acesso a um computador. O guia abre no próprio aparelho.",
    action: "Ver como fazer",
    modalTitle: "Coleta sem computador",
    modalIntro: "Você fará a coleta no próprio celular. O guia abre em outra aba e acompanha todo o processo passo a passo.",
    steps: [
      "Abra o guia e siga todas as etapas no celular, incluindo preparação, depuração sem fio, logger e coleta dos arquivos.",
      "Reproduza o problema enquanto os registros estiverem ativos.",
      "Finalize a coleta conforme o guia e confirme onde os arquivos foram salvos no aparelho.",
      "Volte para esta página e use “Escolha seus arquivos” para enviar o ZIP, TXT, MP4 ou outros arquivos gerados.",
    ],
    returnText: "Importante: você precisa voltar para esta etapa depois da coleta. O atendimento não avança sem pelo menos uma evidência anexada.",
    openGuide: "Abrir guia completo no celular",
    close: "Voltar",
  };
  if (language.startsWith("es")) return {
    badge: "SIN COMPUTADORA",
    title: "Hacer la recopilación usando solo el celular",
    description: "Usa esta opción si no tienes acceso a una computadora. La guía se abre en el propio teléfono.",
    action: "Ver cómo hacerlo",
    modalTitle: "Recopilación sin computadora",
    modalIntro: "Harás la recopilación en el propio celular. La guía se abre en otra pestaña y te acompaña paso a paso.",
    steps: [
      "Abre la guía y sigue todas las etapas en el celular, incluida la preparación, depuración inalámbrica, logger y recopilación de archivos.",
      "Reproduce el problema mientras los registros estén activos.",
      "Finaliza la recopilación según la guía y confirma dónde se guardaron los archivos.",
      "Vuelve a esta página y usa “Elige tus archivos” para subir el ZIP, TXT, MP4 u otros archivos generados.",
    ],
    returnText: "Importante: debes volver a esta etapa después de la recopilación. El caso no avanza sin al menos una evidencia adjunta.",
    openGuide: "Abrir guía completa en el celular",
    close: "Volver",
  };
  if (language.startsWith("zh")) return {
    badge: "无需电脑",
    title: "仅使用手机完成采集",
    description: "如果您没有电脑，请使用此方式。完整指南会直接在手机上打开。",
    action: "查看操作方法",
    modalTitle: "无电脑采集",
    modalIntro: "整个采集过程都在手机上完成。指南将在新页面中打开，并逐步引导您操作。",
    steps: [
      "在手机上打开指南并完成全部步骤，包括准备、无线调试、日志工具和文件采集。",
      "日志记录开启后，请复现您遇到的问题。",
      "按照指南结束采集，并确认生成的文件保存位置。",
      "返回本页面，通过“选择文件”上传生成的 ZIP、TXT、MP4 或其他证据文件。",
    ],
    returnText: "重要：完成采集后必须返回此步骤。至少上传一份证据后才能继续提交。",
    openGuide: "在手机上打开完整指南",
    close: "返回",
  };
  return {
    badge: "NO COMPUTER",
    title: "Collect evidence using only your phone",
    description: "Use this path if you do not have access to a computer. The guide opens directly on the phone.",
    action: "See how it works",
    modalTitle: "Collection without a computer",
    modalIntro: "You will perform the collection on the phone itself. The guide opens in another tab and walks you through every step.",
    steps: [
      "Open the guide and complete every step on the phone, including preparation, wireless debugging, logger setup and file collection.",
      "Reproduce the issue while the technical logs are active.",
      "Finish the collection as instructed and confirm where the generated files were saved.",
      "Return to this page and use “Choose your files” to upload the generated ZIP, TXT, MP4 or other evidence files.",
    ],
    returnText: "Important: return to this collection step when you finish. The case cannot continue until at least one evidence file is attached.",
    openGuide: "Open complete mobile guide",
    close: "Back",
  };
}

function selectedBrand() {
  const image = document.querySelector<HTMLImageElement>(".brand-options button.selected img");
  const brand = (image?.alt || "infinix").toLowerCase();
  return ["infinix", "tecno", "itel"].includes(brand) ? brand : "infinix";
}

function prepareMobileGuide(language: string) {
  const savedLanguage = localStorage.getItem("aftercare-language");
  const browserLanguage = navigator.language.toLowerCase();
  const resolvedLanguage = savedLanguage || language || (browserLanguage.startsWith("zh") ? "zh-CN" : browserLanguage.startsWith("es") ? "es-419" : browserLanguage.startsWith("pt") ? "pt-BR" : "en");
  let current: Record<string, unknown> = {};
  try { current = JSON.parse(localStorage.getItem("transsion-guide-session-v2") || "{}"); } catch {}
  localStorage.setItem("transsion-guide-session-v2", JSON.stringify({
    ...current,
    language: resolvedLanguage,
    countryCode: current.countryCode || "BR",
    brandId: selectedBrand(),
    method: "mobile",
    stage: "guide",
    guideStep: 0,
    reachedStep: 0,
    completed: [],
  }));
}

function applyGuide(copy: DeviceCopy, mobile: MobileFlowCopy, onOpenMobileFlow: () => void) {
  const form = document.querySelector(".form-card");
  if (!form) return;

  const configure = (field: "model" | "software", originalPlaceholder: string, help: string, placeholder: string) => {
    const selector = `input[data-device-field="${field}"]`;
    let input = form.querySelector<HTMLInputElement>(selector);
    if (!input) {
      input = Array.from(form.querySelectorAll<HTMLInputElement>("input")).find(
        (candidate) => candidate.placeholder === originalPlaceholder,
      ) || null;
    }
    if (!input) return;

    input.dataset.deviceField = field;
    input.placeholder = placeholder;

    const previous = input.previousElementSibling as HTMLElement | null;
    let helper = previous?.dataset.deviceHelp === field ? previous : null;
    if (!helper) {
      helper = document.createElement("small");
      helper.dataset.deviceHelp = field;
      helper.style.display = "block";
      helper.style.marginTop = "5px";
      helper.style.lineHeight = "1.5";
      input.before(helper);
    }
    helper.textContent = help;
  };

  configure("model", tx("model"), copy.modelHelp, copy.modelPlaceholder);
  configure("software", tx("software"), copy.softwareHelp, copy.softwarePlaceholder);

  const nativeGuideLink = form.querySelector<HTMLAnchorElement>("a.guide-link");
  if (nativeGuideLink) {
    nativeGuideLink.href = "#mobile-collection-guide";
    nativeGuideLink.target = "";
    nativeGuideLink.onclick = (event) => {
      event.preventDefault();
      onOpenMobileFlow();
    };
  }

  const manualTitle = form.querySelector<HTMLElement>(".manual-evidence-title");
  if (!manualTitle || nativeGuideLink || form.querySelector("[data-no-computer-card]")) return;

  const card = document.createElement("button");
  card.type = "button";
  card.dataset.noComputerCard = "true";
  card.className = "guide-link";
  card.style.width = "100%";
  card.style.textAlign = "left";
  card.style.marginBottom = "18px";
  card.innerHTML = `
    <span style="width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:rgba(72,224,164,.10);color:var(--green);font-size:25px">▣</span>
    <span style="display:flex;flex-direction:column;gap:5px;flex:1">
      <small style="color:var(--green);font-weight:800;letter-spacing:1px">${mobile.badge}</small>
      <strong>${mobile.title}</strong>
      <small>${mobile.description}</small>
      <small style="color:var(--green);margin-top:6px;font-weight:700">${mobile.action} →</small>
    </span>`;
  card.onclick = onOpenMobileFlow;
  manualTitle.before(card);
}

export default function CustomerIntlDeviceGuide({ navigate }: { navigate: (p: string) => void }) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const [mobileFlowOpen, setMobileFlowOpen] = useState(false);
  const mobile = mobileFlowCopy(language);

  useEffect(() => {
    const copy = deviceCopy(language);
    const mobileCopy = mobileFlowCopy(language);
    const refresh = () => applyGuide(copy, mobileCopy, () => setMobileFlowOpen(true));
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const openGuide = () => {
    prepareMobileGuide(language);
    window.open("/guide", "_blank", "noopener,noreferrer");
    setMobileFlowOpen(false);
  };

  return <>
    <CustomerIntlV2 navigate={navigate} />
    {mobileFlowOpen && <div
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileFlowOpen(false); }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(3,12,22,.78)", display: "grid", placeItems: "center", padding: 20 }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="mobile-flow-title" style={{ width: "min(680px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#0d1b2b", border: "1px solid #29425a", borderRadius: 22, padding: 24, boxShadow: "0 24px 80px rgba(0,0,0,.45)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}><Smartphone size={30} color="var(--green)"/><div><small style={{ color: "var(--green)", fontWeight: 800, letterSpacing: 1 }}>{mobile.badge}</small><h2 id="mobile-flow-title" style={{ margin: "4px 0 0" }}>{mobile.modalTitle}</h2></div></div>
          <button type="button" aria-label={mobile.close} onClick={() => setMobileFlowOpen(false)} style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 6 }}><X size={22}/></button>
        </div>
        <p style={{ lineHeight: 1.65, marginTop: 18 }}>{mobile.modalIntro}</p>
        <ol style={{ display: "grid", gap: 12, paddingLeft: 24, lineHeight: 1.6 }}>
          {mobile.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 18, padding: 14, borderRadius: 14, background: "rgba(72,224,164,.08)", border: "1px solid rgba(72,224,164,.22)" }}><UploadCloud size={22} color="var(--green)"/><strong style={{ lineHeight: 1.5 }}>{mobile.returnText}</strong></div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 22 }}>
          <button type="button" className="secondary" onClick={() => setMobileFlowOpen(false)}>{mobile.close}</button>
          <button type="button" className="primary" onClick={openGuide}>{mobile.openGuide}<ArrowRight size={17}/></button>
        </div>
      </div>
    </div>}
  </>;
}
