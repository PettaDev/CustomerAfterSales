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
    newCase: "Novo atendimento", myCase: "Meu caso", tfae: "Área TFAE", privacy: "Privacidade", language: "Idioma", mainNavigation: "Navegação principal", supportLabel: "SUPORTE AO CLIENTE", footerSupport: "Pós-venda e suporte ao cliente",
    intro: "Vamos cuidar do seu aparelho.", introText: "Conte o que aconteceu. Nós organizamos as informações para ajudar você a dar o próximo passo.",
    device: "Seu aparelho", issue: "O problema", collection: "Coleta", details: "Seus dados", step: "ETAPA {{n}} DE 4",
    model: "Modelo do aparelho", software: "Versão do software", problem: "Resumo do problema", reproduce: "Como podemos reproduzir?", expected: "O que deveria acontecer?", carrier: "Operadora",
    contactTitle: "Como podemos falar com você?", contactText: "Seus dados ficam associados a este atendimento.", name: "Seu nome", email: "E-mail", phone: "Telefone", phonePlaceholder: "Ex.: +55 11 99999-9999", country: "País",
    postalCode: "CEP", postalPlaceholder: "Ex.: 01001-000", postalSearch: "Buscar CEP", postalSearching: "Buscando…", postalFound: "Endereço preenchido pelo CEP.", postalInvalid: "Informe um CEP válido com 8 dígitos.",
    street: "Rua / Logradouro", number: "Número", complement: "Complemento", neighborhood: "Bairro", city: "Cidade", state: "Estado / UF", addressOptional: "Opcional",
    continue: "Continuar", back: "Voltar", submit: "Enviar meu caso", sending: "Enviando…", optional: "Opcional", remove: "Remover", caseCreatedUploading: "Atendimento criado. Agora estamos enviando suas evidências.", keepPageOpen: "Mantenha esta página aberta até o envio terminar.", uploadingFile: "Enviando {{name}} · {{progress}}%", uploadFailed: "Seu atendimento foi salvo, mas uma evidência não terminou de enviar. Tente novamente sem sair desta página.",
    captureDesktop: "Reproduza o problema.", captureMobile: "Mostre o que aconteceu.", manualFiles: "Ou envie arquivos que você já possui", chooseFiles: "Escolha seus arquivos",
    mobileGuideBadge: "SEM CABOS", mobileGuideTitle: "Usando apenas o celular", mobileGuideDescription: "Não tenho acesso a um computador neste momento.", mobileGuideAction: "Abrir guia completo no celular",
    warrantyCheckTitle: "Possível garantia", warrantyCheckText: "Você acha que o aparelho ainda pode estar dentro da garantia? Isso não aprova a cobertura automaticamente; serve apenas para preparar a análise.", warrantyYes: "Sim", warrantyUnsure: "Não tenho certeza", warrantyNo: "Não", deviceIdentifier: "IMEI ou número de série", deviceIdentifierHelp: "Opcional. Se o aparelho não liga, você pode encontrar esse número na caixa ou no comprovante de compra.", purchaseDate: "Data da compra", purchaseDateHelp: "Opcional. Informe se souber a data. Se não tiver certeza, deixe em branco.", proofPurchaseHelp: "Se tiver nota fiscal ou comprovante, você pode anexar uma foto junto das evidências de hardware. A cobertura continua sujeita à validação do suporte.",
    consent: "Autorizo o uso dos dados, endereço e evidências deste atendimento para análise técnica. Li as informações de privacidade.",
    advancedCollectionTitle: "Coleta técnica avançada", advancedCollectionText: "Esta coleta não faz parte do autoatendimento. Não use comandos, menus de engenharia ou ferramentas de logs por conta própria.", advancedCollectionNext: "Se a análise precisar de registros técnicos adicionais, nossa equipe enviará instruções específicas para o seu aparelho depois de validar a plataforma e a capacidade real do dispositivo.", advancedCollectionBack: "Voltar ao atendimento",
    received: "Recebemos seu caso.", receivedText: "Guarde o protocolo e o código para acompanhar as atualizações.", protocol: "Protocolo", accessCode: "Código de acesso privado", copy: "Copiar dados de acesso", copied: "Copiado", track: "Acompanhar meu caso"
  },
  en: {
    newCase: "New case", myCase: "My case", tfae: "TFAE area", privacy: "Privacy", language: "Language", mainNavigation: "Main navigation", supportLabel: "CUSTOMER SUPPORT", footerSupport: "After-sales customer support",
    intro: "Let's take care of your device.", introText: "Tell us what happened. We organize the information to help you move forward.",
    device: "Your device", issue: "The issue", collection: "Collection", details: "Your details", step: "STEP {{n}} OF 4",
    model: "Device model", software: "Software version", problem: "Issue summary", reproduce: "How can we reproduce it?", expected: "What should happen?", carrier: "Carrier",
    contactTitle: "How can we contact you?", contactText: "Your details stay linked to this support case.", name: "Your name", email: "Email", phone: "Phone", phonePlaceholder: "e.g. +1 202 555 0123", country: "Country",
    postalCode: "Postal code", postalPlaceholder: "e.g. 01001-000", postalSearch: "Find address", postalSearching: "Searching…", postalFound: "Address filled from the postal code.", postalInvalid: "Enter a valid 8-digit Brazilian CEP.",
    street: "Street", number: "House / building number", complement: "Address line 2", neighborhood: "District / neighborhood", city: "City", state: "State / region", addressOptional: "Optional",
    continue: "Continue", back: "Back", submit: "Submit my case", sending: "Sending…", optional: "Optional", remove: "Remove", caseCreatedUploading: "Your case has been created. We are now uploading your evidence.", keepPageOpen: "Keep this page open until the upload finishes.", uploadingFile: "Uploading {{name}} · {{progress}}%", uploadFailed: "Your case was saved, but one evidence file did not finish uploading. Try again without leaving this page.",
    captureDesktop: "Reproduce the issue.", captureMobile: "Show us what happened.", manualFiles: "Or upload files you already have", chooseFiles: "Choose your files",
    mobileGuideBadge: "NO CABLES", mobileGuideTitle: "Using only your phone", mobileGuideDescription: "I don't have access to a computer right now.", mobileGuideAction: "Open the complete mobile guide",
    warrantyCheckTitle: "Possible warranty", warrantyCheckText: "Do you think the device may still be under warranty? This does not approve coverage automatically; it only helps us prepare the review.", warrantyYes: "Yes", warrantyUnsure: "I am not sure", warrantyNo: "No", deviceIdentifier: "IMEI or serial number", deviceIdentifierHelp: "Optional. If the device will not turn on, you may find this number on the box or purchase document.", purchaseDate: "Purchase date", purchaseDateHelp: "Optional. Enter it if you know the date. If you are not sure, leave it blank.", proofPurchaseHelp: "If you have a receipt or proof of purchase, you can attach a photo with the hardware evidence. Coverage remains subject to support validation.",
    consent: "I authorize the use of this case data, address and evidence for technical analysis. I have read the privacy information.",
    advancedCollectionTitle: "Advanced technical collection", advancedCollectionText: "This collection is not part of self-service. Do not use commands, engineering menus, or log tools on your own.", advancedCollectionNext: "If technical records are needed, our team will send device-specific instructions after validating the device platform and actual capabilities.", advancedCollectionBack: "Return to support case",
    received: "We received your case.", receivedText: "Keep the case number and access code to follow updates.", protocol: "Case number", accessCode: "Private access code", copy: "Copy access details", copied: "Copied", track: "Track my case"
  },
  "es-419": {
    newCase: "Nuevo caso", myCase: "Mi caso", tfae: "Área TFAE", privacy: "Privacidad", language: "Idioma", mainNavigation: "Navegación principal", supportLabel: "SOPORTE AL CLIENTE", footerSupport: "Posventa y soporte al cliente",
    intro: "Vamos a cuidar tu dispositivo.", introText: "Cuéntanos qué ocurrió. Organizamos la información para ayudarte con el siguiente paso.",
    device: "Tu dispositivo", issue: "El problema", collection: "Recopilación", details: "Tus datos", step: "PASO {{n}} DE 4",
    model: "Modelo del dispositivo", software: "Versión de software", problem: "Resumen del problema", reproduce: "¿Cómo podemos reproducirlo?", expected: "¿Qué debería ocurrir?", carrier: "Operador",
    contactTitle: "¿Cómo podemos contactarte?", contactText: "Tus datos quedan asociados a este caso.", name: "Tu nombre", email: "Correo electrónico", phone: "Teléfono", phonePlaceholder: "Ej.: +52 55 1234 5678", country: "País",
    postalCode: "Código postal / CEP", postalPlaceholder: "Ej.: 01001-000", postalSearch: "Buscar dirección", postalSearching: "Buscando…", postalFound: "Dirección completada a partir del CEP.", postalInvalid: "Ingresa un CEP brasileño válido de 8 dígitos.",
    street: "Calle / vía", number: "Número", complement: "Complemento", neighborhood: "Barrio", city: "Ciudad", state: "Estado / región", addressOptional: "Opcional",
    continue: "Continuar", back: "Volver", submit: "Enviar mi caso", sending: "Enviando…", optional: "Opcional", remove: "Eliminar", caseCreatedUploading: "Tu caso fue creado. Ahora estamos enviando tus evidencias.", keepPageOpen: "Mantén esta página abierta hasta que termine el envío.", uploadingFile: "Enviando {{name}} · {{progress}}%", uploadFailed: "Tu caso fue guardado, pero una evidencia no terminó de enviarse. Inténtalo nuevamente sin salir de esta página.",
    captureDesktop: "Reproduce el problema.", captureMobile: "Muéstranos qué ocurrió.", manualFiles: "O envía archivos que ya tengas", chooseFiles: "Elige tus archivos",
    mobileGuideBadge: "SIN CABLES", mobileGuideTitle: "Usando solo el celular", mobileGuideDescription: "No tengo acceso a una computadora en este momento.", mobileGuideAction: "Abrir la guía completa en el celular",
    warrantyCheckTitle: "Posible garantía", warrantyCheckText: "¿Crees que el dispositivo todavía puede estar dentro de la garantía? Esto no aprueba la cobertura automáticamente; solo ayuda a preparar la revisión.", warrantyYes: "Sí", warrantyUnsure: "No estoy seguro", warrantyNo: "No", deviceIdentifier: "IMEI o número de serie", deviceIdentifierHelp: "Opcional. Si el dispositivo no enciende, puedes encontrar este número en la caja o en el comprobante de compra.", purchaseDate: "Fecha de compra", purchaseDateHelp: "Opcional. Indícala si conoces la fecha. Si no estás seguro, déjala en blanco.", proofPurchaseHelp: "Si tienes factura o comprobante de compra, puedes adjuntar una foto junto con las evidencias de hardware. La cobertura sigue sujeta a validación del soporte.",
    consent: "Autorizo el uso de los datos, la dirección y las evidencias de este caso para análisis técnico. He leído la información de privacidad.",
    advancedCollectionTitle: "Recopilación técnica avanzada", advancedCollectionText: "Esta recopilación no forma parte del autoservicio. No uses comandos, menús de ingeniería ni herramientas de logs por tu cuenta.", advancedCollectionNext: "Si se necesitan registros técnicos, nuestro equipo enviará instrucciones específicas después de validar la plataforma y las capacidades reales del dispositivo.", advancedCollectionBack: "Volver al caso",
    received: "Recibimos tu caso.", receivedText: "Guarda el número de caso y el código para consultar las actualizaciones.", protocol: "Número de caso", accessCode: "Código de acceso privado", copy: "Copiar datos de acceso", copied: "Copiado", track: "Seguir mi caso"
  },
  "zh-CN": {
    newCase: "新建服务单", myCase: "我的服务单", tfae: "TFAE 工作区", privacy: "隐私", language: "语言", mainNavigation: "主导航", supportLabel: "客户支持", footerSupport: "售后客户支持",
    intro: "我们来协助处理您的设备问题。", introText: "请告诉我们发生了什么。我们会整理信息，帮助您进入下一步。",
    device: "设备信息", issue: "问题描述", collection: "采集", details: "您的资料", step: "第 {{n}} 步，共 4 步",
    model: "设备型号", software: "软件版本", problem: "问题摘要", reproduce: "如何复现？", expected: "预期应该发生什么？", carrier: "运营商",
    contactTitle: "我们如何联系您？", contactText: "您的资料将与本服务单关联。", name: "姓名", email: "电子邮箱", phone: "电话", phonePlaceholder: "例如 +86 138 0000 0000", country: "国家/地区",
    postalCode: "邮政编码 / CEP", postalPlaceholder: "例如 01001-000", postalSearch: "查询地址", postalSearching: "查询中…", postalFound: "已根据邮政编码填写地址。", postalInvalid: "请输入有效的 8 位巴西 CEP。",
    street: "街道", number: "门牌号", complement: "地址补充", neighborhood: "街区", city: "城市", state: "州 / 地区", addressOptional: "可选",
    continue: "继续", back: "返回", submit: "提交服务单", sending: "正在发送…", optional: "可选", remove: "移除", caseCreatedUploading: "服务单已创建，现在正在上传证据。", keepPageOpen: "请保持此页面打开，直到上传完成。", uploadingFile: "正在上传 {{name}} · {{progress}}%", uploadFailed: "服务单已保存，但有一份证据未完成上传。请不要离开此页面并重试。",
    captureDesktop: "请复现问题。", captureMobile: "请展示问题现象。", manualFiles: "或上传您已有的文件", chooseFiles: "选择文件",
    mobileGuideBadge: "无需数据线", mobileGuideTitle: "仅使用手机", mobileGuideDescription: "我目前无法使用电脑。", mobileGuideAction: "打开完整手机操作指南",
    warrantyCheckTitle: "可能的保修", warrantyCheckText: "您认为设备可能仍在保修期内吗？这不会自动确认保修资格，只是帮助支持团队提前准备审核。", warrantyYes: "是", warrantyUnsure: "不确定", warrantyNo: "否", deviceIdentifier: "IMEI 或序列号", deviceIdentifierHelp: "可选。如果设备无法开机，可尝试在包装盒或购买凭证上查找此编号。", purchaseDate: "购买日期", purchaseDateHelp: "可选。如知道确切日期请填写；如果不确定，可以留空。", proofPurchaseHelp: "如果有发票或购买凭证，可以将照片与硬件证据一起上传。最终保修资格仍需支持团队验证。",
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
