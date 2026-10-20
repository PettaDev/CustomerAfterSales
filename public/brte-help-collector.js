/* Static Central de Ajuda: BRTE Collector is the primary no-PC route.
   Technical Termux guide is available only as an opt-in advanced alternative.
   This script never reads or writes customer form data or access tokens. */
(() => {
  const translations = {
    "pt-BR": {
      eyebrow: "SEM COMPUTADOR · BRTE COLLECTOR",
      title: "Colete vídeo e logs pelo celular com BRTE Collector",
      description: "O aplicativo Android orienta a gravação da tela e dos logs técnicos no próprio celular, sem computador nem Termux.",
      step1: "Baixe e instale o aplicativo quando o APK oficial estiver disponível",
      step2: "Siga o pareamento e inicie vídeo + logs",
      step3: "Reproduza o problema e gere o ZIP de evidências",
      step4: "Volte ao atendimento BRTE e anexe o ZIP",
      button: "Conhecer BRTE Collector ↗",
      note: "O APK de produção ainda está em validação. Consulte a página do aplicativo para acompanhar a liberação.",
      advancedSummary: "Precisa de coleta avançada? Ver alternativa Termux + Wi-Fi",
      advancedDescription: "Use o guia técnico somente quando a equipe de suporte solicitar. Ele não substitui o aplicativo como opção principal.",
      advancedButton: "Abrir guia técnico avançado ↗",
    },
    en: {
      eyebrow: "NO COMPUTER · BRTE COLLECTOR",
      title: "Record video and collect logs on your phone with BRTE Collector",
      description: "The Android app guides you through screen recording and technical log collection without a computer or Termux.",
      step1: "Download and install the app once the official APK is available",
      step2: "Follow the pairing guide and start video + logs",
      step3: "Reproduce the issue and generate the evidence ZIP",
      step4: "Return to your BRTE case and attach the ZIP",
      button: "Explore BRTE Collector ↗",
      note: "The production APK is still being validated. Check the app page for its availability.",
      advancedSummary: "Need advanced logging? See the Termux + Wi-Fi alternative",
      advancedDescription: "Use the technical guide only when instructed by the support team. It is not the default collection method.",
      advancedButton: "Open advanced technical guide ↗",
    },
    "es-419": {
      eyebrow: "SIN COMPUTADORA · BRTE COLLECTOR",
      title: "Graba vídeo y recopila registros desde tu teléfono con BRTE Collector",
      description: "La aplicación Android te guía para grabar la pantalla y recopilar registros técnicos sin computadora ni Termux.",
      step1: "Descarga e instala la aplicación cuando esté disponible el APK oficial",
      step2: "Sigue la guía de emparejamiento e inicia vídeo + registros",
      step3: "Reproduce el problema y genera el ZIP de evidencias",
      step4: "Vuelve al caso BRTE y adjunta el ZIP",
      button: "Conocer BRTE Collector ↗",
      note: "El APK de producción sigue en validación. Consulta la página de la aplicación para ver su disponibilidad.",
      advancedSummary: "¿Necesitas registros avanzados? Ver alternativa Termux + Wi-Fi",
      advancedDescription: "Utiliza la guía técnica únicamente cuando lo solicite soporte. No es el método principal.",
      advancedButton: "Abrir guía técnica avanzada ↗",
    },
    "zh-CN": {
      eyebrow: "无需电脑 · BRTE COLLECTOR",
      title: "使用 BRTE Collector 在手机上录屏并收集日志",
      description: "Android 应用将指导您在手机上录屏并采集技术日志，无需电脑或 Termux。",
      step1: "官方 APK 发布后下载并安装应用",
      step2: "按照配对指南操作并开始录屏与日志采集",
      step3: "复现问题并生成证据 ZIP 文件",
      step4: "返回 BRTE 服务单并上传 ZIP 文件",
      button: "了解 BRTE Collector ↗",
      note: "正式版 APK 仍在验证中。请在应用页面查看发布状态。",
      advancedSummary: "需要高级日志采集？查看 Termux + Wi-Fi 备用方式",
      advancedDescription: "仅在支持团队明确要求时使用高级技术指南。该流程不是默认采集方式。",
      advancedButton: "打开高级技术指南 ↗",
    },
  };

  const LANG_KEY = "aftercare-language";
  const pick = value => Object.hasOwn(translations, value) ? value : null;
  const fromBrowser = () => {
    const value = (navigator.language || "en").toLowerCase();
    return value.startsWith("pt") ? "pt-BR" :
      value.startsWith("es") ? "es-419" :
      value.startsWith("zh") ? "zh-CN" : "en";
  };
  const readLanguage = () => {
    try {
      const selected = pick(localStorage.getItem(LANG_KEY));
      if (selected) return selected;
    } catch { /* storage disabled */ }
    return fromBrowser();
  };

  const update = language => {
    const dict = translations[pick(language) || readLanguage()];
    for (const el of document.querySelectorAll("[data-brte-collector-help]")) {
      const key = el.getAttribute("data-brte-collector-help");
      if (Object.hasOwn(dict, key)) el.textContent = dict[key];
    }
  };
  update(readLanguage());
  window.addEventListener("brte:language", event => update(event.detail?.language));
})();
