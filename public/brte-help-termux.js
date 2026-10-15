/* Static Help Center: localized, optional entry to the existing mobile guide.
   The Help Center does not know the customer's device brand: start at brand
   selection, then let the user choose Phone, without sharing case data. */
(() => {
  const items = {
    "pt-BR": {
      eyebrow: "GUIA OPCIONAL · COLETA TÉCNICA",
      title: "Coletar logs pelo celular com Termux + Wi-Fi",
      description: "Se a equipe solicitar logs, veja o tutorial de coleta pelo próprio celular, sem computador, para Infinix, TECNO ou itel.",
      step1: "Escolher a marca e preparar o Termux",
      step2: "Ativar a depuração sem fio",
      step3: "Salvar e anexar os arquivos coletados",
      button: "Abrir tutorial passo a passo ↗",
      note: "Abre em outra aba. A coleta avançada é opcional e deve ser feita somente quando o suporte orientar.",
    },
    en: {
      eyebrow: "OPTIONAL GUIDE · TECHNICAL LOGS",
      title: "Collect phone logs using Termux + Wi-Fi",
      description: "If support asks for logs, use this phone-only guide for Infinix, TECNO or itel. No computer is required.",
      step1: "Select your brand and prepare Termux",
      step2: "Enable wireless debugging",
      step3: "Save and attach the collected files",
      button: "Open step-by-step guide ↗",
      note: "Opens in a new tab. Advanced collection is optional and should only be done with support guidance.",
    },
    "es-419": {
      eyebrow: "GUÍA OPCIONAL · REGISTROS TÉCNICOS",
      title: "Recopilar registros desde el teléfono con Termux + Wi-Fi",
      description: "Si soporte solicita registros, consulta esta guía para Infinix, TECNO o itel. No necesitas computadora.",
      step1: "Elegir la marca y preparar Termux",
      step2: "Activar la depuración inalámbrica",
      step3: "Guardar y adjuntar los archivos recopilados",
      button: "Abrir guía paso a paso ↗",
      note: "Se abre en otra pestaña. La recopilación avanzada es opcional y debe realizarse bajo indicaciones de soporte.",
    },
    "zh-CN": {
      eyebrow: "可选指南 · 技术日志",
      title: "使用 Termux + Wi-Fi 在手机上收集日志",
      description: "支持团队要求日志时，请使用适用于 Infinix、TECNO 或 itel 的手机采集指南，无需电脑。",
      step1: "选择品牌并准备 Termux",
      step2: "开启无线调试",
      step3: "保存并上传采集的文件",
      button: "打开分步指南 ↗",
      note: "指南在新标签页打开。高级日志采集仅应在支持团队指导下进行。",
    },
  };
  const LANG_KEY = "aftercare-language";
  const GUIDE_KEY = "transsion-guide-session-v2";
  const readLanguage = () => {
    try {
      const selected = localStorage.getItem(LANG_KEY);
      if (selected && Object.hasOwn(items, selected)) return selected;
    } catch { /* storage may be blocked */ }
    const browser = (navigator.language || "en").toLowerCase();
    return browser.startsWith("pt") ? "pt-BR" :
      browser.startsWith("es") ? "es-419" :
      browser.startsWith("zh") ? "zh-CN" : "en";
  };
  let selected = readLanguage();
  const apply = language => {
    selected = Object.hasOwn(items, language) ? language : readLanguage();
    const dict = items[selected];
    for (const node of document.querySelectorAll("[data-brte-termux]")) {
      const key = node.getAttribute("data-brte-termux");
      if (Object.hasOwn(dict, key)) node.textContent = dict[key];
    }
  };
  apply(selected);
  window.addEventListener("brte:language", event => {
    apply(event.detail?.language);
  });
  document.querySelector(".brte-termux-help-cta")?.addEventListener("click", () => {
    // Do not reuse stale brand/step selections from another guide session.
    try {
      localStorage.setItem(GUIDE_KEY, JSON.stringify({
        language: selected,
        countryCode: "BR",
        brandId: null,
        method: null,
        stage: "brand",
        guideStep: 0,
        reachedStep: 0,
        completed: [],
      }));
    } catch { /* Without storage, the original wizard still works. */ }
  });
})();
