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
    postalCode: "CEP", postalPlaceholder: "Ex.: 01001-000", postalSearch: "Buscar CEP", postalSearching: "Buscando…", postalFound: "Endereço preenchido pelo CEP.", postalInvalid: "Informe um CEP válido com 8 dígitos.",
    street: "Rua / Logradouro", number: "Número", complement: "Complemento", neighborhood: "Bairro", city: "Cidade", state: "Estado / UF", addressOptional: "Opcional",
    continue: "Continuar", back: "Voltar", submit: "Enviar meu caso", sending: "Enviando…", optional: "Opcional", remove: "Remover",
    captureDesktop: "Reproduza o problema.", captureMobile: "Mostre o que aconteceu.", manualFiles: "Ou envie arquivos que você já possui", chooseFiles: "Escolha seus arquivos",
    mobileGuideBadge: "SEM CABOS", mobileGuideTitle: "Usando apenas o celular", mobileGuideDescription: "Não tenho acesso a um computador neste momento.", mobileGuideAction: "Abrir guia completo no celular",
    consent: "Autorizo o uso dos dados, endereço e evidências deste atendimento para análise técnica. Li as informações de privacidade.",
    advancedCollectionTitle: "Coleta técnica avançada", advancedCollectionText: "Esta coleta não faz parte do autoatendimento. Não use comandos, menus de engenharia ou ferramentas de logs por conta própria.", advancedCollectionNext: "Se a análise precisar de registros técnicos adicionais, nossa equipe enviará instruções específicas para o seu aparelho depois de validar a plataforma e a capacidade real do dispositivo.", advancedCollectionBack: "Voltar ao atendimento",
    received: "Recebemos seu caso.", receivedText: "Guarde o protocolo e o código para acompanhar as atualizações.", protocol: "Protocolo", accessCode: "Código de acesso privado", copy: "Copiar dados de acesso", copied: "Copiado", track: "Acompanhar meu caso"
  },
  en: {
    newCase: "New case", myCase: "My case", tfae: "TFAE area", privacy: "Privacy", language: "Language",
    intro: "Let's take care of your device.", introText: "Tell us what happened. We organize the information to help you move forward.",
    device: "Your device", issue: "The issue", collection: "Collection", details: "Your details", step: "STEP {{n}} OF 4",
    model: "Device model", software: "Software version", problem: "Issue summary", reproduce: "How can we reproduce it?", expected: "What should happen?", carrier: "Carrier",
    contactTitle: "How can we contact you?", contactText: "Your details stay linked to this support case.", name: "Your name", email: "Email", phone: "Phone", phonePlaceholder: "e.g. +1 202 555 0123", country: "Country",
    postalCode: "Postal code", postalPlaceholder: "e.g. 01001-000", postalSearch: "Find address", postalSearching: "Searching…", postalFound: "Address filled from the postal code.", postalInvalid: "Enter a valid 8-digit Brazilian CEP.",
    street: "Street", number: "House / building number", complement: "Address line 2", neighborhood: "District / neighborhood", city: "City", state: "State / region", addressOptional: "Optional",
    continue: "Continue", back: "Back", submit: "Submit my case", sending: "Sending…", optional: "Optional", remove: "Remove",
    captureDesktop: "Reproduce the issue.", captureMobile: "Show us what happened.", manualFiles: "Or upload files you already have", chooseFiles: "Choose your files",
    mobileGuideBadge: "NO CABLES", mobileGuideTitle: "Using only your phone", mobileGuideDescription: "I don't have access to a computer right now.", mobileGuideAction: "Open the complete mobile guide",
    consent: "I authorize the use of this case data, address and evidence for technical analysis. I have read the privacy information.",
    advancedCollectionTitle: "Advanced technical collection", advancedCollectionText: "This collection is not part of self-service. Do not use commands, engineering menus, or log tools on your own.", advancedCollectionNext: "If technical records are needed, our team will send device-specific instructions after validating the device platform and actual capabilities.", advancedCollectionBack: "Return to support case",
    received: "We received your case.", receivedText: "Keep the case number and access code to follow updates.", protocol: "Case number", accessCode: "Private access code", copy: "Copy access details", copied: "Copied", track: "Track my case"
  },
  "es-419": {
    newCase: "Nuevo caso", myCase: "Mi caso", tfae: "Área TFAE", privacy: "Privacidad", language: "Idioma",
    intro: "Vamos a cuidar tu dispositivo.", introText: "Cuéntanos qué ocurrió. Organizamos la información para ayudarte con el siguiente paso.",
    device: "Tu dispositivo", issue: "El problema", collection: "Recopilación", details: "Tus datos", step: "PASO {{n}} DE 4",
    model: "Modelo del dispositivo", software: "Versión de software", problem: "Resumen del problema", reproduce: "¿Cómo podemos reproducirlo?", expected: "¿Qué debería ocurrir?", carrier: "Operador",
    contactTitle: "¿Cómo podemos contactarte?", contactText: "Tus datos quedan asociados a este caso.", name: "Tu nombre", email: "Correo electrónico", phone: "Teléfono", phonePlaceholder: "Ej.: +52 55 1234 5678", country: "País",
    postalCode: "Código postal / CEP", postalPlaceholder: "Ej.: 01001-000", postalSearch: "Buscar dirección", postalSearching: "Buscando…", postalFound: "Dirección completada a partir del CEP.", postalInvalid: "Ingresa un CEP brasileño válido de 8 dígitos.",
    street: "Calle / vía", number: "Número", complement: "Complemento", neighborhood: "Barrio", city: "Ciudad", state: "Estado / región", addressOptional: "Opcional",
    continue: "Continuar", back: "Volver", submit: "Enviar mi caso", sending: "Enviando…", optional: "Opcional", remove: "Eliminar",
    captureDesktop: "Reproduce el problema.", captureMobile: "Muéstranos qué ocurrió.", manualFiles: "O envía archivos que ya tengas", chooseFiles: "Elige tus archivos",
    mobileGuideBadge: "SIN CABLES", mobileGuideTitle: "Usando solo el celular", mobileGuideDescription: "No tengo acceso a una computadora en este momento.", mobileGuideAction: "Abrir la guía completa en el celular",
    consent: "Autorizo el uso de los datos, la dirección y las evidencias de este caso para análisis técnico. He leído la información de privacidad.",
    advancedCollectionTitle: "Recopilación técnica avanzada", advancedCollectionText: "Esta recopilación no forma parte del autoservicio. No uses comandos, menús de ingeniería ni herramientas de logs por tu cuenta.", advancedCollectionNext: "Si se necesitan registros técnicos, nuestro equipo enviará instrucciones específicas después de validar la plataforma y las capacidades reales del dispositivo.", advancedCollectionBack: "Volver al caso",
    received: "Recibimos tu caso.", receivedText: "Guarda el número de caso y el código para consultar las actualizaciones.", protocol: "Número de caso", accessCode: "Código de acceso privado", copy: "Copiar datos de acceso", copied: "Copiado", track: "Seguir mi caso"
  },
  "zh-CN": {
    newCase: "新建服务单", myCase: "我的服务单", tfae: "TFAE 工作区", privacy: "隐私", language: "语言",
    intro: "我们来协助处理您的设备问题。", introText: "请告诉我们发生了什么。我们会整理信息，帮助您进入下一步。",
    device: "设备信息", issue: "问题描述", collection: "采集", details: "您的资料", step: "第 {{n}} 步，共 4 步",
    model: "设备型号", software: "软件版本", problem: "问题摘要", reproduce: "如何复现？", expected: "预期应该发生什么？", carrier: "运营商",
    contactTitle: "我们如何联系您？", contactText: "您的资料将与本服务单关联。", name: "姓名", email: "电子邮箱", phone: "电话", phonePlaceholder: "例如 +86 138 0000 0000", country: "国家/地区",
    postalCode: "邮政编码 / CEP", postalPlaceholder: "例如 01001-000", postalSearch: "查询地址", postalSearching: "查询中…", postalFound: "已根据邮政编码填写地址。", postalInvalid: "请输入有效的 8 位巴西 CEP。",
    street: "街道", number: "门牌号", complement: "地址补充", neighborhood: "街区", city: "城市", state: "州 / 地区", addressOptional: "可选",
    continue: "继续", back: "返回", submit: "提交服务单", sending: "正在发送…", optional: "可选", remove: "移除",
    captureDesktop: "请复现问题。", captureMobile: "请展示问题现象。", manualFiles: "或上传您已有的文件", chooseFiles: "选择文件",
    mobileGuideBadge: "无需数据线", mobileGuideTitle: "仅使用手机", mobileGuideDescription: "我目前无法使用电脑。", mobileGuideAction: "打开完整手机操作指南",
    consent: "我同意将本服务单中的数据、地址和证据用于技术分析，并已阅读隐私信息。",
    advancedCollectionTitle: "高级技术采集", advancedCollectionText: "此采集不属于自助流程。请勿自行使用命令、工程菜单或日志工具。", advancedCollectionNext: "如果分析需要更多技术记录，支持团队会先验证设备的实际平台和能力，再发送适用于该设备的具体操作说明。", advancedCollectionBack: "返回服务单",
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
