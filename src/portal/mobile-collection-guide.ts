/* Launch the existing brand-specific phone guide from BRTE intake.
   Only guide preferences are shared across tabs, never customer information. */
const GUIDE_STORAGE_KEY = "transsion-guide-session-v2";
export function prepareMobileCollectionGuide(brand: string, language: string): boolean {
  if (typeof window === "undefined") return false;
  const safeBrand = ["infinix", "tecno", "itel"].includes(brand) ? brand : null;
  if (!safeBrand) return false;
  const safeLanguage = language.startsWith("pt") ? "pt-BR" :
    language.startsWith("es") ? "es-419" : language.startsWith("zh") ? "zh-CN" : "en";
  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify({
      language: safeLanguage, countryCode: "BR", brandId: safeBrand,
      method: "mobile", stage: "guide", guideStep: 0, reachedStep: 0, completed: [],
    }));
    return true;
  } catch { return false; }
}

export function mobileGuideText(language: string) {
  if (language.startsWith("pt")) return {
    eyebrow: "GUIA OPCIONAL · COLETA TÉCNICA",
    title: "Coletar logs pelo celular com Termux + Wi-Fi",
    description: "Se a equipe solicitar logs, acompanhe o passo a passo específico para o seu aparelho. Você não precisa de computador.",
    steps: ["Preparar o Termux", "Ativar depuração sem fio", "Salvar e anexar os logs"],
    button: "Abrir tutorial passo a passo",
    note: "Abre em outra aba e mantém este atendimento aberto. Use apenas quando o suporte orientar.",
  };
  if (language.startsWith("es")) return {
    eyebrow: "GUÍA OPCIONAL · REGISTROS TÉCNICOS",
    title: "Recopilar registros desde el teléfono con Termux + Wi-Fi",
    description: "Si soporte solicita registros, sigue la guía de tu dispositivo. No se necesita computadora.",
    steps: ["Preparar Termux", "Activar la depuración inalámbrica", "Guardar y adjuntar los registros"],
    button: "Abrir guía paso a paso",
    note: "Se abre en otra pestaña y mantiene este caso abierto. Úsala solo cuando lo indique soporte.",
  };
  if (language.startsWith("zh")) return {
    eyebrow: "可选指南 · 技术日志",
    title: "通过手机 Termux + Wi-Fi 收集日志",
    description: "支持团队要求收集日志时，请按照设备专属的分步指南操作，无需电脑。",
    steps: ["准备 Termux", "开启无线调试", "保存并上传日志"],
    button: "打开分步教程",
    note: "在新标签页打开，当前服务单将保持不变。请仅在支持团队指导下使用。",
  };
  return {
    eyebrow: "OPTIONAL GUIDE · TECHNICAL LOGS",
    title: "Collect phone logs with Termux + Wi-Fi",
    description: "If support requests technical logs, follow your device-specific guide. No computer is required.",
    steps: ["Prepare Termux", "Enable wireless debugging", "Save and attach the logs"],
    button: "Open step-by-step tutorial",
    note: "Opens in another tab and keeps this case open. Use only when instructed by support.",
  };
}
