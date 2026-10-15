/* Reuse the pre-existing brand-specific Termux / Wi-Fi Debugging guide.
   Its context is separate from customer intake and contains no personal data. */
const GUIDE_STORAGE_KEY = "transsion-guide-session-v2";

export function prepareMobileCollectionGuide(brand: string, language: string): boolean {
  if (typeof window === "undefined") return false;
  const safeBrand = ["infinix", "tecno", "itel"].includes(brand) ? brand : "infinix";
  const safeLanguage = ["pt-BR", "en", "es-419", "zh-CN"].includes(language) ? language : "pt-BR";
  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify({
      language: safeLanguage,
      countryCode: "BR",
      brandId: safeBrand,
      method: "mobile",
      stage: "guide",
      guideStep: 0,
      reachedStep: 0,
      completed: [],
    }));
    return true;
  } catch { return false; }
}

export function mobileCollectionCopy(language: string) {
  if (language.startsWith("pt")) return {
    guideTitle: "Guia de coleta por celular — Termux e Wi-Fi",
    guideDescription: "Se o suporte solicitar logs técnicos, siga o guia específico para sua marca. Ele explica Termux, depuração sem fio e como salvar os arquivos.",
    openGuide: "Abrir guia passo a passo",
    backFromGuide: "O guia abre em outra aba. Volte aqui para anexar os arquivos gerados e continuar seu atendimento.",
    draftRestored: "Seu rascunho foi recuperado nesta aba. Você pode continuar de onde parou.",
    draftPrivacy: "O progresso é salvo somente nesta aba por até 2 horas. Anexos, IMEI e autorização não são salvos.",
    filesLost: "Por segurança, os arquivos escolhidos anteriormente precisam ser selecionados novamente.",
    discardDraft: "Descartar rascunho",
  };
  if (language.startsWith("es")) return {
    guideTitle: "Guía de recopilación móvil — Termux y Wi-Fi",
    guideDescription: "Si soporte solicita registros técnicos, sigue la guía de tu marca. Explica Termux, depuración inalámbrica y cómo guardar los archivos.",
    openGuide: "Abrir guía paso a paso",
    backFromGuide: "La guía se abre en otra pestaña. Vuelve aquí para adjuntar los archivos y continuar tu caso.",
    draftRestored: "Hemos recuperado tu borrador en esta pestaña. Puedes continuar donde lo dejaste.",
    draftPrivacy: "El progreso se guarda solo en esta pestaña durante un máximo de 2 horas. No se guardan archivos, IMEI ni consentimiento.",
    filesLost: "Por seguridad, debes seleccionar de nuevo los archivos adjuntos anteriormente.",
    discardDraft: "Descartar borrador",
  };
  if (language.startsWith("zh")) return {
    guideTitle: "手机采集指南 — Termux 与 Wi-Fi 调试",
    guideDescription: "如支持团队需要技术日志，请按照对应品牌的指南操作，了解 Termux、无线调试和文件保存方法。",
    openGuide: "打开分步指南",
    backFromGuide: "指南将在新标签页打开。完成后返回此处上传文件并继续提交。",
    draftRestored: "已在当前标签页恢复草稿，可继续之前的操作。",
    draftPrivacy: "进度仅在当前标签页保存最多 2 小时。不会保存附件、IMEI 或同意状态。",
    filesLost: "出于安全原因，请重新选择之前的附件。",
    discardDraft: "删除草稿",
  };
  return {
    guideTitle: "Phone collection guide — Termux and Wi-Fi",
    guideDescription: "If support requests technical logs, follow the guide for your brand. It covers Termux, wireless debugging and saving files.",
    openGuide: "Open step-by-step guide",
    backFromGuide: "The guide opens in another tab. Come back here to attach the collected files and finish your case.",
    draftRestored: "Your draft has been restored in this tab. Continue where you left off.",
    draftPrivacy: "Progress is saved in this tab for up to 2 hours. Attachments, IMEI and consent are not saved.",
    filesLost: "For security, you will need to select previously attached files again.",
    discardDraft: "Discard draft",
  };
}
