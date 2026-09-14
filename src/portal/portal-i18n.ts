import i18n from "../i18n";

export const portalLanguages = [
  ["pt-BR", "Português"],
  ["en", "English"],
  ["es-419", "Español"],
  ["zh-CN", "简体中文"],
] as const;

type Lang = (typeof portalLanguages)[number][0];

const text: Record<Lang, Record<string, string>> = {
  "pt-BR": {
    newCase: "Novo atendimento", myCase: "Meu caso", tfae: "Área TFAE", privacy: "Privacidade", language: "Idioma",
    intro: "Vamos cuidar do seu aparelho.", introText: "Conte o que aconteceu. Nós organizamos as informações para ajudar você a dar o próximo passo.",
    device: "Seu aparelho", issue: "O problema", collection: "Coleta", details: "Seus dados", step: "ETAPA {{n}} DE 4",
    model: "Modelo do aparelho", software: "Versão do software", problem: "Resumo do problema", reproduce: "Como podemos reproduzir?", expected: "O que deveria acontecer?", carrier: "Operadora",
    contactTitle: "Como podemos falar com você?", contactText: "Seus dados ficam associados a este atendimento.", name: "Seu nome", email: "E-mail", phone: "Telefone", phonePlaceholder: "Ex.: +55 11 99999-9999", country: "País",
    continue: "Continuar", back: "Voltar", submit: "Enviar meu caso", sending: "Enviando…", optional: "Opcional", remove: "Remover",
    captureDesktop: "Reproduza o problema.", captureMobile: "Mostre o que aconteceu.", manualFiles: "Ou envie arquivos que você já possui", chooseFiles: "Escolha seus arquivos",
    consent: "Autorizo o uso dos dados e das evidências deste atendimento para análise técnica. Li as informações de privacidade.",
    received: "Recebemos seu caso.", receivedText: "Guarde o protocolo e o código para acompanhar as atualizações.", protocol: "Protocolo", accessCode: "Código de acesso privado", copy: "Copiar dados de acesso", copied: "Copiado", track: "Acompanhar meu caso"
  },
  en: {
    newCase: "New case", myCase: "My case", tfae: "TFAE area", privacy: "Privacy", language: "Language",
    intro: "Let's take care of your device.", introText: "Tell us what happened. We organize the information to help you move forward.",
    device: "Your device", issue: "The issue", collection: "Collection", details: "Your details", step: "STEP {{n}} OF 4",
    model: "Device model", software: "Software version", problem: "Issue summary", reproduce: "How can we reproduce it?", expected: "What should happen?", carrier: "Carrier",
    contactTitle: "How can we contact you?", contactText: "Your details stay linked to this support case.", name: "Your name", email: "Email", phone: "Phone", phonePlaceholder: "e.g. +1 202 555 0123", country: "Country",
    continue: "Continue", back: "Back", submit: "Submit my case", sending: "Sending…", optional: "Optional", remove: "Remove",
    captureDesktop: "Reproduce the issue.", captureMobile: "Show us what happened.", manualFiles: "Or upload files you already have", chooseFiles: "Choose your files",
    consent: "I authorize the use of this case data and evidence for technical analysis. I have read the privacy information.",
    received: "We received your case.", receivedText: "Keep the case number and access code to follow updates.", protocol: "Case number", accessCode: "Private access code", copy: "Copy access details", copied: "Copied", track: "Track my case"
  },
  "es-419": {
    newCase: "Nuevo caso", myCase: "Mi caso", tfae: "Área TFAE", privacy: "Privacidad", language: "Idioma",
    intro: "Vamos a cuidar tu dispositivo.", introText: "Cuéntanos qué ocurrió. Organizamos la información para ayudarte con el siguiente paso.",
    device: "Tu dispositivo", issue: "El problema", collection: "Recopilación", details: "Tus datos", step: "PASO {{n}} DE 4",
    model: "Modelo del dispositivo", software: "Versión de software", problem: "Resumen del problema", reproduce: "¿Cómo podemos reproducirlo?", expected: "¿Qué debería ocurrir?", carrier: "Operador",
    contactTitle: "¿Cómo podemos contactarte?", contactText: "Tus datos quedan asociados a este caso.", name: "Tu nombre", email: "Correo electrónico", phone: "Teléfono", phonePlaceholder: "Ej.: +52 55 1234 5678", country: "País",
    continue: "Continuar", back: "Volver", submit: "Enviar mi caso", sending: "Enviando…", optional: "Opcional", remove: "Eliminar",
    captureDesktop: "Reproduce el problema.", captureMobile: "Muéstranos qué ocurrió.", manualFiles: "O envía archivos que ya tengas", chooseFiles: "Elige tus archivos",
    consent: "Autorizo el uso de los datos y evidencias de este caso para análisis técnico. He leído la información de privacidad.",
    received: "Recibimos tu caso.", receivedText: "Guarda el número de caso y el código para consultar las actualizaciones.", protocol: "Número de caso", accessCode: "Código de acceso privado", copy: "Copiar datos de acceso", copied: "Copiado", track: "Seguir mi caso"
  },
  "zh-CN": {
    newCase: "新建服务单", myCase: "我的服务单", tfae: "TFAE 工作区", privacy: "隐私", language: "语言",
    intro: "我们来协助处理您的设备问题。", introText: "请告诉我们发生了什么。我们会整理信息，帮助您进入下一步。",
    device: "设备信息", issue: "问题描述", collection: "采集", details: "您的资料", step: "第 {{n}} 步，共 4 步",
    model: "设备型号", software: "软件版本", problem: "问题摘要", reproduce: "如何复现？", expected: "预期应该发生什么？", carrier: "运营商",
    contactTitle: "我们如何联系您？", contactText: "您的资料将与本服务单关联。", name: "姓名", email: "电子邮箱", phone: "电话", phonePlaceholder: "例如 +86 138 0000 0000", country: "国家/地区",
    continue: "继续", back: "返回", submit: "提交服务单", sending: "正在发送…", optional: "可选", remove: "移除",
    captureDesktop: "请复现问题。", captureMobile: "请展示问题现象。", manualFiles: "或上传您已有的文件", chooseFiles: "选择文件",
    consent: "我同意将本服务单中的数据和证据用于技术分析，并已阅读隐私信息。",
    received: "我们已收到您的服务单。", receivedText: "请保存服务单号和访问码，以便查看后续更新。", protocol: "服务单号", accessCode: "私密访问码", copy: "复制访问信息", copied: "已复制", track: "查看我的服务单"
  }
};

export function portalText(key: string, vars: Record<string, string | number> = {}) {
  const lang = (portalLanguages.some(([code]) => code === i18n.language) ? i18n.language : "en") as Lang;
  let value = text[lang][key] || text.en[key] || key;
  for (const [name, replacement] of Object.entries(vars)) value = value.replace(`{{${name}}}`, String(replacement));
  return value;
}

export function setPortalLanguage(language: string) {
  const lang = portalLanguages.some(([code]) => code === language) ? language : "en";
  localStorage.setItem("aftercare-language", lang);
  return i18n.changeLanguage(lang);
}

export function initPortalLanguage() {
  const saved = localStorage.getItem("aftercare-language");
  const browser = navigator.language.toLowerCase();
  const lang = saved || (browser.startsWith("zh") ? "zh-CN" : browser.startsWith("es") ? "es-419" : browser.startsWith("pt") ? "pt-BR" : "en");
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}
