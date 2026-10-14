import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Cable,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  UploadCloud,
} from "lucide-react";
import TrackedBrowserCapture from "./TrackedBrowserCapture";
import { api, post, upload } from "./api";
import { portalText as tx } from "./portal-i18n";

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

type CollectionMethod = "mobile" | "browser" | null;

type FlowCopy = {
  issueTypePrompt: string;
  softwareProblem: string;
  softwareProblemDesc: string;
  softwareProblemExamples: string;
  hardwareProblem: string;
  hardwareProblemDesc: string;
  hardwareProblemExamples: string;
  modelHelp: string;
  modelPlaceholder: string;
  softwareHelp: string;
  softwarePlaceholder: string;
  problemHelp: string;
  problemPlaceholderSoftware: string;
  problemPlaceholderHardware: string;
  reproduceHelp: string;
  reproducePlaceholderSoftware: string;
  reproducePlaceholderHardware: string;
  expectedHelp: string;
  expectedPlaceholder: string;
  carrierHelp: string;
  carrierPlaceholder: string;
  collectionTitle: string;
  collectionText: string;
  chooseMethodTitle: string;
  chooseMethodText: string;
  noComputerBadge: string;
  noComputerTitle: string;
  noComputerDescription: string;
  noComputerGuide: string;
  browserBadge: string;
  browserTitle: string;
  browserDescription: string;
  browserUnavailable: string;
  resetCollection: string;
  resetBlocked: string;
  automaticEvidence: string;
  evidenceRequired: string;
  methodRequired: string;
  softwareContactText: string;
  hardwareContactText: string;
  sendError: string;
  fileSizeError: string;
  hardwareCollectionTitle: string;
  hardwareCollectionText: string;
  hardwareEvidenceTitle: string;
  hardwareEvidenceHint: string;
  hardwareChargerNotice: string;
  hardwareWarrantyNotice: string;
  hardwareValidationNotice: string;
  hardwareEvidenceRequired: string;
  hardwareFileTypeError: string;
  privacyFirst: string;
  fileSingle: string;
  filePlural: string;
};

function flowCopy(language: string): FlowCopy {
  if (language.startsWith("pt")) return {
    issueTypePrompt: "Primeiro, escolha a opção que mais se parece com o problema.",
    softwareProblem: "Problema de software",
    softwareProblemDesc: "Falha no sistema, aplicativo ou conexão, mesmo sem dano físico aparente.",
    softwareProblemExamples: "Ex.: app fecha sozinho, Wi‑Fi/Bluetooth desconecta, aparelho reinicia, notificações não chegam, erro após atualização.",
    hardwareProblem: "Problema de hardware",
    hardwareProblemDesc: "Falha em uma peça ou componente físico do aparelho.",
    hardwareProblemExamples: "Ex.: tela com linhas/manchas, touch não responde, não carrega, microfone ou alto-falante sem funcionar, botão quebrado.",
    modelHelp: "Informe o nome comercial ou o código do modelo que aparece no aparelho.",
    modelPlaceholder: "Ex.: Infinix GT 30 Pro (X6873)",
    softwareHelp: "No aparelho, acesse Configurações > Modelo > Número da Versão e copie o número exibido.",
    softwarePlaceholder: "Ex.: X6873-16.3.0.150SP06(OP005PF001AZ)",
    problemHelp: "Resuma em uma frase o principal sintoma. Não precisa explicar tudo aqui.",
    problemPlaceholderSoftware: "Ex.: Wi‑Fi desconecta sozinho depois de alguns minutos",
    problemPlaceholderHardware: "Ex.: Tela apresenta linhas verdes e o toque falha no lado direito",
    reproduceHelp: "Se quiser, adicione observações, passos ou detalhes que ajudem a entender a falha. Este campo não tem quantidade mínima de caracteres.",
    reproducePlaceholderSoftware: "Ex.: Abra Configurações > Wi‑Fi, conecte à rede e use o celular até a desconexão acontecer.",
    reproducePlaceholderHardware: "Ex.: Ligue a tela, abra qualquer aplicativo e toque na região em que o touch falha.",
    expectedHelp: "Explique como o aparelho deveria se comportar normalmente.",
    expectedPlaceholder: "Ex.: O Wi‑Fi deveria permanecer conectado sem interrupções.",
    carrierHelp: "Informe a operadora usada. Se o problema não envolver rede móvel ou não se aplicar, escreva “Não se aplica”.",
    carrierPlaceholder: "Ex.: Vivo, TIM, Claro — ou Não se aplica",
    collectionTitle: "Reproduza o problema durante a coleta.",
    collectionText: "Escolha abaixo como você fará a coleta. A opção com computador anexa os arquivos automaticamente; a opção sem computador permite enviar os arquivos manualmente depois do guia.",
    chooseMethodTitle: "Como você quer fazer a coleta?",
    chooseMethodText: "Escolha uma opção para continuar. Você pode reiniciar esta etapa e trocar o método antes de enviar o caso.",
    noComputerBadge: "SEM COMPUTADOR",
    noComputerTitle: "Usar apenas o celular",
    noComputerDescription: "Siga o guia no próprio aparelho e depois envie manualmente as fotos, ZIPs, vídeos ou logs gerados.",
    noComputerGuide: "Abrir guia completo no celular",
    browserBadge: "COMPUTADOR / NAVEGADOR",
    browserTitle: "Coleta direta pelo navegador",
    browserDescription: "Conecte o aparelho por USB. Ao finalizar a coleta, as evidências são anexadas automaticamente e você segue para seus dados.",
    browserUnavailable: "Esta opção precisa de um computador com navegador compatível e conexão USB.",
    resetCollection: "Reiniciar",
    resetBlocked: "Finalize ou cancele a operação atual antes de reiniciar a escolha da coleta.",
    automaticEvidence: "Coleta concluída e evidências anexadas automaticamente.",
    evidenceRequired: "Adicione pelo menos uma evidência antes de continuar.",
    methodRequired: "Escolha primeiro se fará a coleta apenas pelo celular ou pelo computador/navegador.",
    softwareContactText: "Para casos de software, precisamos somente de nome, e-mail e telefone para contato.",
    hardwareContactText: "Para casos de hardware, precisamos também dos dados completos para associação e eventual garantia.",
    sendError: "Não foi possível concluir o envio. Seus dados continuam nesta tela. Verifique a mensagem abaixo e tente novamente.",
    fileSizeError: "Não foi possível adicionar um dos arquivos. Cada evidência precisa ter conteúdo e no máximo 1 GB.",
    hardwareCollectionTitle: "Envie fotos ou um vídeo do problema",
    hardwareCollectionText: "Para casos de hardware, a coleta é somente manual. Tire fotos ou grave um vídeo curto mostrando claramente o defeito. Não é necessário conectar o aparelho ao computador.",
    hardwareEvidenceTitle: "Fotos e vídeo do aparelho",
    hardwareEvidenceHint: "Mostre uma visão geral do aparelho e um close do defeito. Se possível, grave um vídeo curto reproduzindo o problema.",
    hardwareChargerNotice: "Quando for seguro, mantenha o celular conectado ao carregador durante as fotos ou o vídeo e mostre o cabo/conector e a reação do aparelho. Isso ajuda a evitar dúvidas na triagem. Não conecte o carregador se houver bateria estufada, aquecimento anormal, cheiro, líquido ou dano visível no conector.",
    hardwareWarrantyNotice: "Se a garantia for confirmada na triagem, enviaremos um e-mail e uma mensagem pelo WhatsApp com o número do chamado e os próximos passos.",
    hardwareValidationNotice: "Antes de autorizar o envio do aparelho, poderemos solicitar fotos adicionais, IMEI, comprovante de compra e testes simples para confirmar a falha e evitar um envio desnecessário.",
    hardwareEvidenceRequired: "Adicione pelo menos uma foto ou um vídeo do problema antes de continuar.",
    hardwareFileTypeError: "Para casos de hardware, envie somente fotos ou vídeos.",
    privacyFirst: "Coleta de diagnóstico com privacidade em primeiro lugar.",
    fileSingle: "arquivo",
    filePlural: "arquivos",
  };
  if (language.startsWith("es")) return {
    issueTypePrompt: "Primero, elige la opción que más se parezca al problema.",
    softwareProblem: "Problema de software",
    softwareProblemDesc: "Falla del sistema, una aplicación o una conexión, sin un daño físico evidente.",
    softwareProblemExamples: "Ej.: una app se cierra, Wi‑Fi/Bluetooth se desconecta, el teléfono se reinicia, no llegan notificaciones, falla después de actualizar.",
    hardwareProblem: "Problema de hardware",
    hardwareProblemDesc: "Falla relacionada con una pieza o componente físico del dispositivo.",
    hardwareProblemExamples: "Ej.: líneas/manchas en pantalla, zona táctil sin respuesta, no carga, micrófono/altavoz falla, botón roto.",
    modelHelp: "Indica el nombre comercial o el código de modelo que aparece en el dispositivo.",
    modelPlaceholder: "Ej.: Infinix GT 30 Pro (X6873)",
    softwareHelp: "En el dispositivo, ve a Ajustes > Modelo > Número de versión y copia el número mostrado.",
    softwarePlaceholder: "Ej.: X6873-16.3.0.150SP06(OP005PF001AZ)",
    problemHelp: "Resume el síntoma principal en una sola frase. Puedes explicar más abajo.",
    problemPlaceholderSoftware: "Ej.: El Wi‑Fi se desconecta solo después de unos minutos",
    problemPlaceholderHardware: "Ej.: Aparecen líneas verdes en pantalla y el táctil falla del lado derecho",
    reproduceHelp: "Si quieres, agrega observaciones, pasos o detalles útiles. Este campo no tiene una cantidad mínima de caracteres.",
    reproducePlaceholderSoftware: "Ej.: Abre Ajustes > Wi‑Fi, conéctate y usa el teléfono hasta que ocurra la desconexión.",
    reproducePlaceholderHardware: "Ej.: Enciende la pantalla, abre cualquier app y toca la zona donde falla el táctil.",
    expectedHelp: "Explica cómo debería comportarse normalmente el dispositivo.",
    expectedPlaceholder: "Ej.: El Wi‑Fi debería permanecer conectado sin interrupciones.",
    carrierHelp: "Indica el operador que utilizas. Si no aplica, escribe “No aplica”.",
    carrierPlaceholder: "Ej.: Telcel, Claro, Movistar — o No aplica",
    collectionTitle: "Reproduce el problema durante la recopilación.",
    collectionText: "Elige cómo harás la recopilación. Con computadora los archivos se adjuntan automáticamente; sin computadora podrás cargarlos manualmente después de seguir la guía.",
    chooseMethodTitle: "¿Cómo quieres hacer la recopilación?",
    chooseMethodText: "Elige una opción para continuar. Puedes reiniciar este paso y cambiar el método antes de enviar el caso.",
    noComputerBadge: "SIN COMPUTADORA",
    noComputerTitle: "Usar solo el celular",
    noComputerDescription: "Sigue la guía en el propio teléfono y luego sube manualmente las fotos, ZIP, videos o logs generados.",
    noComputerGuide: "Abrir la guía completa en el celular",
    browserBadge: "COMPUTADORA / NAVEGADOR",
    browserTitle: "Recopilación directa desde el navegador",
    browserDescription: "Conecta el teléfono por USB. Al finalizar, las evidencias se adjuntan automáticamente y pasarás a tus datos.",
    browserUnavailable: "Esta opción necesita una computadora con navegador compatible y conexión USB.",
    resetCollection: "Reiniciar",
    resetBlocked: "Finaliza o cancela la operación actual antes de reiniciar la selección.",
    automaticEvidence: "Recopilación finalizada y evidencias adjuntadas automáticamente.",
    evidenceRequired: "Agrega al menos una evidencia antes de continuar.",
    methodRequired: "Primero elige si harás la recopilación solo con el celular o con computadora/navegador.",
    softwareContactText: "Para casos de software, solo necesitamos nombre, correo electrónico y teléfono.",
    hardwareContactText: "Para casos de hardware, también necesitamos los datos completos para asociación y una posible garantía.",
    sendError: "No pudimos completar el envío. Tus datos siguen en esta página. Revisa el mensaje e inténtalo de nuevo.",
    fileSizeError: "No se pudo agregar uno de los archivos. Cada evidencia debe contener datos y tener como máximo 1 GB.",
    hardwareCollectionTitle: "Envía fotos o un video del problema",
    hardwareCollectionText: "Para casos de hardware, la recopilación es únicamente manual. Toma fotos o graba un video corto que muestre claramente la falla. No es necesario conectar el dispositivo a una computadora.",
    hardwareEvidenceTitle: "Fotos y video del dispositivo",
    hardwareEvidenceHint: "Muestra una vista general del dispositivo y un primer plano de la falla. Si es posible, graba un video corto reproduciendo el problema.",
    hardwareChargerNotice: "Cuando sea seguro, mantén el celular conectado al cargador mientras tomas las fotos o grabas el video y muestra el cable/conector y la reacción del dispositivo. Esto ayuda a evitar dudas durante la revisión. No conectes el cargador si la batería está hinchada, hay calor anormal, olor, líquido o daño visible en el conector.",
    hardwareWarrantyNotice: "Si la garantía se confirma durante la revisión, enviaremos un correo electrónico y un mensaje por WhatsApp con el número del caso y los próximos pasos.",
    hardwareValidationNotice: "Antes de autorizar el envío del dispositivo, podremos solicitar fotos adicionales, IMEI, comprobante de compra y pruebas sencillas para confirmar la falla y evitar un envío innecesario.",
    hardwareEvidenceRequired: "Agrega al menos una foto o un video del problema antes de continuar.",
    hardwareFileTypeError: "Para casos de hardware, envía solamente fotos o videos.",
    privacyFirst: "Recopilación de diagnóstico con la privacidad como prioridad.",
    fileSingle: "archivo",
    filePlural: "archivos",
  };
  if (language.startsWith("zh")) return {
    issueTypePrompt: "请先选择最符合当前问题的类型。",
    softwareProblem: "软件问题",
    softwareProblemDesc: "系统、应用或连接功能异常，且没有明显的物理损坏。",
    softwareProblemExamples: "例如：应用闪退、Wi‑Fi/蓝牙断开、手机重启、通知不到、更新后异常。",
    hardwareProblem: "硬件问题",
    hardwareProblemDesc: "与设备实体零件或硬件组件有关的故障。",
    hardwareProblemExamples: "例如：屏幕线条/斑点、部分触控失灵、无法充电、麦克风/扬声器失效、按键损坏。",
    modelHelp: "请输入设备上显示的商品名称或型号代码。",
    modelPlaceholder: "例如：Infinix GT 30 Pro (X6873)",
    softwareHelp: "请打开 设置 > 型号 > 版本号，并复制显示的版本信息。",
    softwarePlaceholder: "例如：X6873-16.3.0.150SP06(OP005PF001AZ)",
    problemHelp: "请用一句话概括最主要的现象。",
    problemPlaceholderSoftware: "例如：Wi‑Fi 使用几分钟后会自动断开",
    problemPlaceholderHardware: "例如：屏幕出现绿色线条，右侧触控失灵",
    reproduceHelp: "可选填写补充说明、操作步骤或其他细节。本字段没有最少字符数限制。",
    reproducePlaceholderSoftware: "例如：打开设置 > Wi‑Fi，连接网络并使用手机，直到断开。",
    reproducePlaceholderHardware: "例如：点亮屏幕，打开任意应用，然后点击触控异常区域。",
    expectedHelp: "请说明设备正常情况下应该如何工作。",
    expectedPlaceholder: "例如：Wi‑Fi 应保持连接，不应中断。",
    carrierHelp: "请输入运营商。如果不适用，请填写“不适用”。",
    carrierPlaceholder: "例如：中国移动 / Claro — 或 不适用",
    collectionTitle: "请在采集过程中复现问题。",
    collectionText: "请选择采集方式。使用电脑时，采集完成后证据会自动附加；仅使用手机时，请按照指南完成后手动上传文件。",
    chooseMethodTitle: "您希望如何进行采集？",
    chooseMethodText: "请选择一种方式。提交服务单前可以重新开始此步骤并更换方式。",
    noComputerBadge: "无需电脑",
    noComputerTitle: "仅使用手机",
    noComputerDescription: "在手机上按照指南操作，完成后手动上传照片、ZIP、视频或日志。",
    noComputerGuide: "在手机上打开完整指南",
    browserBadge: "电脑 / 浏览器",
    browserTitle: "浏览器直接采集",
    browserDescription: "通过 USB 连接手机。采集结束后证据会自动附加，并进入联系信息步骤。",
    browserUnavailable: "此方式需要电脑、兼容浏览器和 USB 连接。",
    resetCollection: "重新开始",
    resetBlocked: "请先结束或取消当前操作，然后再重新选择采集方式。",
    automaticEvidence: "采集完成，证据已自动附加。",
    evidenceRequired: "继续之前请至少添加一份证据。",
    methodRequired: "请先选择仅使用手机或使用电脑/浏览器进行采集。",
    softwareContactText: "软件问题只需要姓名、电子邮箱和电话。",
    hardwareContactText: "硬件问题还需要完整信息，以便设备关联和后续保修处理。",
    sendError: "提交未能完成。您的信息仍保留在此页面。请查看错误并重试。",
    fileSizeError: "无法添加其中一个文件。每份证据必须包含内容且大小不超过 1 GB。",
    hardwareCollectionTitle: "请上传问题照片或视频",
    hardwareCollectionText: "硬件问题仅使用手动取证。请拍照或录制短视频，清楚展示故障现象。无需将设备连接到电脑。",
    hardwareEvidenceTitle: "设备照片和视频",
    hardwareEvidenceHint: "请拍摄设备整体，并对故障位置进行特写。如条件允许，请录制一段短视频复现问题。",
    hardwareChargerNotice: "在确保安全的情况下，拍照或录像时请将手机连接充电器，并展示线缆/接口以及设备反应，以减少审核中的疑问。如果出现电池鼓包、异常发热、异味、液体或充电接口明显损坏，请勿连接充电器。",
    hardwareWarrantyNotice: "如果审核确认设备仍在保修范围内，我们将通过电子邮件和 WhatsApp 发送服务单号及后续步骤。",
    hardwareValidationNotice: "在批准寄送设备之前，我们可能会要求补充照片、IMEI、购买凭证以及简单测试，以确认故障并避免不必要的寄送。",
    hardwareEvidenceRequired: "继续之前，请至少上传一张问题照片或一段视频。",
    hardwareFileTypeError: "硬件问题仅接受照片或视频。",
    privacyFirst: "以隐私为优先的诊断采集。",
    fileSingle: "个文件",
    filePlural: "个文件",
  };
  return {
    issueTypePrompt: "First, choose the option that best matches the issue.",
    softwareProblem: "Software issue",
    softwareProblemDesc: "A system, app, or connectivity failure without an obvious physical defect.",
    softwareProblemExamples: "Examples: app crashes, Wi‑Fi/Bluetooth disconnects, device reboots, notifications fail, issue started after an update.",
    hardwareProblem: "Hardware issue",
    hardwareProblemDesc: "A failure involving a physical part or component of the device.",
    hardwareProblemExamples: "Examples: lines/spots on screen, touch area not responding, no charging, microphone/speaker failure, broken button.",
    modelHelp: "Enter the commercial device name or model code shown on the phone.",
    modelPlaceholder: "e.g. Infinix GT 30 Pro (X6873)",
    softwareHelp: "On the device, open Settings > Model > Version number and copy the version shown.",
    softwarePlaceholder: "e.g. X6873-16.3.0.150SP06(OP005PF001AZ)",
    problemHelp: "Summarize the main symptom in one sentence. You can add more detail below.",
    problemPlaceholderSoftware: "Example: Wi‑Fi disconnects by itself after a few minutes",
    problemPlaceholderHardware: "Example: Green lines appear on the display and touch fails on the right side",
    reproduceHelp: "Optionally add notes, steps, or any useful detail. This field has no minimum character requirement.",
    reproducePlaceholderSoftware: "Example: Open Settings > Wi‑Fi, connect to the network, and use the phone until it disconnects.",
    reproducePlaceholderHardware: "Example: Turn on the display, open any app, and touch the area where touch input fails.",
    expectedHelp: "Tell us how the device should normally behave.",
    expectedPlaceholder: "Example: Wi‑Fi should stay connected without interruptions.",
    carrierHelp: "Enter the carrier in use. If it does not apply, enter “Not applicable”.",
    carrierPlaceholder: "e.g. T-Mobile, AT&T — or Not applicable",
    collectionTitle: "Reproduce the issue while collecting evidence.",
    collectionText: "Choose how you want to collect evidence. With a computer, files are attached automatically; without a computer, you can upload them manually after following the guide.",
    chooseMethodTitle: "How do you want to collect evidence?",
    chooseMethodText: "Choose one option to continue. You can restart this step and switch methods before submitting the case.",
    noComputerBadge: "NO COMPUTER",
    noComputerTitle: "Use only the phone",
    noComputerDescription: "Follow the guide on the phone and then manually upload the photos, ZIPs, videos, or logs you generated.",
    noComputerGuide: "Open the complete mobile guide",
    browserBadge: "COMPUTER / BROWSER",
    browserTitle: "Direct browser collection",
    browserDescription: "Connect the phone over USB. When collection finishes, evidence is attached automatically and you move to your contact details.",
    browserUnavailable: "This option requires a computer with a compatible browser and USB connection.",
    resetCollection: "Restart",
    resetBlocked: "Finish or cancel the current operation before restarting the collection choice.",
    automaticEvidence: "Collection complete and evidence attached automatically.",
    evidenceRequired: "Add at least one evidence file before continuing.",
    methodRequired: "First choose whether to collect using only the phone or using a computer/browser.",
    softwareContactText: "For software cases, we only need your name, email, and phone number.",
    hardwareContactText: "For hardware cases, we also need complete details for device association and possible warranty handling.",
    sendError: "We could not complete the submission. Your information is still on this page. Review the message below and try again.",
    fileSizeError: "One of the files could not be added. Each evidence file must contain data and be no larger than 1 GB.",
    hardwareCollectionTitle: "Upload photos or a video of the issue",
    hardwareCollectionText: "For hardware cases, evidence collection is manual only. Take photos or record a short video that clearly shows the fault. You do not need to connect the device to a computer.",
    hardwareEvidenceTitle: "Device photos and video",
    hardwareEvidenceHint: "Show an overall view of the device and a close-up of the fault. If possible, record a short video reproducing the issue.",
    hardwareChargerNotice: "When it is safe, keep the phone connected to its charger while taking photos or recording the video, and show the cable/connector and the phone's response. This helps avoid uncertainty during triage. Do not connect a charger if the battery is swollen, the phone is unusually hot, there is an odor, liquid, or visible connector damage.",
    hardwareWarrantyNotice: "If warranty coverage is confirmed during triage, we will send an email and a WhatsApp message with the case number and next steps.",
    hardwareValidationNotice: "Before authorizing device shipment, we may request additional photos, IMEI, proof of purchase, and simple checks to confirm the fault and avoid unnecessary shipping.",
    hardwareEvidenceRequired: "Add at least one photo or video of the issue before continuing.",
    hardwareFileTypeError: "For hardware cases, upload photos or videos only.",
    privacyFirst: "Privacy-first diagnostic collection.",
    fileSingle: "file",
    filePlural: "files",
  };
}

export default function CustomerFlow({ navigate }: { navigate: (p: string) => void }) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const copy = flowCopy(language);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>(null);
  const [browserBusy, setBrowserBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>();
  const [copied, setCopied] = useState(false);
  const [postalBusy, setPostalBusy] = useState(false);
  const [postalMessage, setPostalMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [form, setForm] = useState({
    brand: "infinix", model: "", build: "", category: "software", problem: "", description: "", expected: "", carrier: "",
    name: "", email: "", phone: "", country: "Brasil", postalCode: "", street: "", addressNumber: "", addressComplement: "",
    neighborhood: "", city: "", state: "", consent: false,
  });

  const desktop = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const hardware = form.category === "hardware";
  const brazil = /^(brasil|brazil)$/i.test(form.country.trim());
  const steps = [tx("device"), tx("issue"), tx("collection"), tx("details")];
  const field = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const markInvalid = (key: string) => setInvalidFields((current) => current.includes(key) ? current : [...current, key]);
  const clearInvalid = (key: string) => setInvalidFields((current) => current.filter((item) => item !== key));
  const requiredLabel = (label: string) => <>{label} <span aria-hidden="true" style={{ color: "#ff6b81" }}>*</span></>;
  const requiredProps = (key: string) => ({
    required: true,
    "aria-invalid": invalidFields.includes(key) || undefined,
    onInvalid: (event: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) => { event.preventDefault(); markInvalid(key); },
    onFocus: () => clearInvalid(key),
    onClick: () => clearInvalid(key),
    style: invalidFields.includes(key) ? { borderColor: "#ff5c73", boxShadow: "0 0 0 1px rgba(255, 92, 115, 0.28)" } : undefined,
  });
  const help = (text: string) => <small style={{ display: "block", marginTop: 5, lineHeight: 1.5 }}>{text}</small>;

  const selectCategory = (category: "software" | "hardware") => {
    setForm((current) => ({ ...current, category }));
    setCollectionMethod(category === "hardware" ? "mobile" : null);
    setFiles([]);
    setError("");
  };

  function prepareMobileGuide() {
    const savedLanguage = localStorage.getItem("aftercare-language");
    const browserLanguage = navigator.language.toLowerCase();
    const resolved = savedLanguage || language || (browserLanguage.startsWith("zh") ? "zh-CN" : browserLanguage.startsWith("es") ? "es-419" : browserLanguage.startsWith("pt") ? "pt-BR" : "en");
    let current: Record<string, unknown> = {};
    try { current = JSON.parse(localStorage.getItem("transsion-guide-session-v2") || "{}"); } catch { current = {}; }
    localStorage.setItem("transsion-guide-session-v2", JSON.stringify({
      ...current,
      language: resolved,
      countryCode: current.countryCode || "BR",
      brandId: form.brand,
      method: "mobile",
      stage: "guide",
      guideStep: 0,
      reachedStep: 0,
      completed: [],
    }));
  }

  const filesAreValid = (incoming: File[]) => {
    if (incoming.some((file) => !file.size || file.size > 1024 ** 3)) {
      setError(copy.fileSizeError);
      return false;
    }
    if (hardware && incoming.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      setError(copy.hardwareFileTypeError);
      return false;
    }
    return true;
  };

  const addFiles = (incoming: File[]) => {
    if (!filesAreValid(incoming)) return;
    setFiles((current) => [...current, ...incoming]);
    setError("");
  };

  const handleBrowserFiles = (incoming: File[]) => {
    if (!incoming.length || !filesAreValid(incoming)) return;
    setFiles(incoming);
    setError("");
    setStep(3);
  };

  const selectCollectionMethod = (method: Exclude<CollectionMethod, null>) => {
    setCollectionMethod(method);
    setFiles([]);
    setError("");
  };

  const resetCollection = () => {
    if (browserBusy) {
      setError(copy.resetBlocked);
      return;
    }
    setCollectionMethod(null);
    setFiles([]);
    setError("");
  };

  async function lookupPostalCode() {
    if (!hardware || !brazil) return;
    const digits = form.postalCode.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) { setPostalMessage(tx("postalInvalid")); markInvalid("postalCode"); return; }
    setPostalBusy(true); setPostalMessage("");
    try {
      const data = await api<any>(`/postal/br/${digits}`);
      setForm((current) => ({ ...current, postalCode: formatCep(data.postalCode || digits), street: data.street || current.street, neighborhood: data.neighborhood || current.neighborhood, city: data.city || current.city, state: data.state || current.state, addressComplement: current.addressComplement || data.addressComplement || "" }));
      clearInvalid("postalCode"); setPostalMessage(tx("postalFound"));
    } catch (caught) {
      markInvalid("postalCode");
      setPostalMessage(caught instanceof Error ? caught.message : String(caught));
    } finally { setPostalBusy(false); }
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      let currentResult = result;
      if (!currentResult) {
        const payload = hardware ? form : {
          ...form,
          country: "",
          postalCode: "",
          street: "",
          addressNumber: "",
          addressComplement: "",
          neighborhood: "",
          city: "",
          state: "",
        };
        currentResult = await api("/cases", post(payload));
        setResult(currentResult);
        sessionStorage.setItem("case-access", JSON.stringify({ id: currentResult.case.id, token: currentResult.accessToken }));
      }
      for (const file of [...files]) {
        await upload(currentResult.case.id, currentResult.accessToken, file);
        setFiles((current) => current.filter((item) => item !== file));
      }
      setStep(4);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : String(caught);
      setError(`${copy.sendError}${detail ? ` ${detail}` : ""}`);
    } finally { setBusy(false); }
  }

  const advance = () => {
    if (step === 2) {
      if (hardware) {
        if (files.length === 0) { setError(copy.hardwareEvidenceRequired); return; }
      } else {
        if (!collectionMethod) { setError(copy.methodRequired); return; }
        if (collectionMethod === "browser" && files.length === 0) { setError(copy.evidenceRequired); return; }
        if (collectionMethod === "mobile" && files.length === 0) { setError(copy.evidenceRequired); return; }
      }
    }
    setError("");
    if (step < 3) setStep(step + 1);
    else void submit();
  };

  if (step === 4) return <section className="customer-wrap"><div className="success-card"><span className="success-icon"><CheckCircle2 size={44}/></span><h1>{tx("received")}</h1><p>{tx("receivedText")}</p><div className="access-box"><small>{tx("protocol")}</small><strong>{result.case.id}</strong><small>{tx("accessCode")}</small><code>{result.accessToken}</code></div><button className="primary" onClick={async()=>{await navigator.clipboard.writeText(`${result.case.id}\n${result.accessToken}`);setCopied(true);}}><Copy size={17}/>{copied?tx("copied"):tx("copy")}</button><button className="secondary" onClick={()=>navigate("tracking")}>{tx("track")}<ArrowRight size={17}/></button>{error&&<p className="error" role="alert">{error}</p>}</div></section>;

  const showPrimary = step !== 2 || hardware || collectionMethod === "mobile" || (collectionMethod === "browser" && files.length > 0);

  return <section className="customer-wrap"><div className="intro"><span className="eyebrow">AFTERCARE · TRANSSION</span><h1>{tx("intro")}</h1><p>{tx("introText")}</p></div><div className="customer-layout"><aside className="journey"><span className="eyebrow">AFTERCARE</span>{steps.map((label,index)=><div key={label} className={`journey-step ${step===index?"current":step>index?"done":""}`}><span>{step>index?<Check size={16}/>:String(index+1).padStart(2,"0")}</span><div><strong>{label}</strong></div></div>)}<div className="privacy-note"><ShieldCheck size={20}/><p>{copy.privacyFirst}</p></div></aside>
  <form className="form-card" onSubmit={(event)=>{event.preventDefault();advance();}}>
  <div className="step-heading"><span>{tx("step",{n:step+1})}</span><small>{Math.round((step+1)*25)}%</small></div><div className="progress"><i style={{width:`${(step+1)*25}%`}}/></div>

  {step===0&&<><h2>{tx("device")}</h2><div className="brand-options">{["infinix","tecno","itel"].map((brand)=><button type="button" key={brand} className={form.brand===brand?"selected":""} onClick={()=>field("brand",brand)}><img src={`/brandmarks/${brand}.svg`} alt={brand}/><span className="radio-mark">{form.brand===brand&&<Check size={12}/>}</span></button>)}</div><label>{requiredLabel(tx("model"))}{help(copy.modelHelp)}<input {...requiredProps("model")} minLength={2} maxLength={100} placeholder={copy.modelPlaceholder} value={form.model} onChange={(e)=>field("model",e.target.value)}/></label><label>{requiredLabel(tx("software"))}{help(copy.softwareHelp)}<input {...requiredProps("build")} maxLength={180} placeholder={copy.softwarePlaceholder} value={form.build} onChange={(e)=>field("build",e.target.value)}/></label></>}

  {step===1&&<><h2>{tx("issue")}</h2><p style={{marginBottom:18}}>{copy.issueTypePrompt}</p><div className="choice-row"><button type="button" className={`option ${form.category==="software"?"selected":""}`} onClick={()=>selectCategory("software")}><strong>{copy.softwareProblem}</strong><small style={{lineHeight:1.5}}>{copy.softwareProblemDesc}</small><small style={{color:"var(--green)",lineHeight:1.5}}>{copy.softwareProblemExamples}</small></button><button type="button" className={`option ${form.category==="hardware"?"selected":""}`} onClick={()=>selectCategory("hardware")}><strong>{copy.hardwareProblem}</strong><small style={{lineHeight:1.5}}>{copy.hardwareProblemDesc}</small><small style={{color:"var(--green)",lineHeight:1.5}}>{copy.hardwareProblemExamples}</small></button></div>
  <label>{requiredLabel(tx("problem"))}{help(copy.problemHelp)}<input {...requiredProps("problem")} minLength={5} maxLength={180} placeholder={hardware?copy.problemPlaceholderHardware:copy.problemPlaceholderSoftware} value={form.problem} onChange={(e)=>field("problem",e.target.value)}/></label>
  <label>{tx("reproduce")} <em>{tx("optional")}</em>{help(copy.reproduceHelp)}<textarea rows={5} placeholder={hardware?copy.reproducePlaceholderHardware:copy.reproducePlaceholderSoftware} value={form.description} onChange={(e)=>field("description",e.target.value)}/></label>
  <label>{requiredLabel(tx("expected"))}{help(copy.expectedHelp)}<input {...requiredProps("expected")} minLength={3} maxLength={1000} placeholder={copy.expectedPlaceholder} value={form.expected} onChange={(e)=>field("expected",e.target.value)}/></label>
  <label>{requiredLabel(tx("carrier"))}{help(copy.carrierHelp)}<input {...requiredProps("carrier")} minLength={2} maxLength={80} placeholder={copy.carrierPlaceholder} value={form.carrier} onChange={(e)=>field("carrier",e.target.value)}/></label></>}

  {step===2&&hardware&&<><h2>{copy.hardwareCollectionTitle}</h2><p>{copy.hardwareCollectionText}</p><div className="hint" role="note"><ShieldCheck size={20}/><p><strong>{copy.hardwareEvidenceTitle}</strong><br/>{copy.hardwareEvidenceHint}</p></div><div className="hint" role="note"><Smartphone size={20}/><p>{copy.hardwareChargerNotice}</p></div><div className="hint" role="note"><ShieldCheck size={20}/><p><strong>{copy.hardwareWarrantyNotice}</strong><br/>{copy.hardwareValidationNotice}</p></div><span className="manual-evidence-title">{copy.hardwareEvidenceTitle}</span><label className="dropzone"><UploadCloud size={34}/><strong>{tx("chooseFiles")}</strong><input type="file" multiple accept="image/*,video/*" onChange={(e)=>addFiles(Array.from(e.target.files||[]))}/></label>{files.map((file,index)=><div className="file-row" key={`${file.name}-${file.size}-${index}`}><FileText size={18}/><span>{file.name}</span><button type="button" onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))}>{tx("remove")}</button></div>)}</>}

  {step===2&&!hardware&&<><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><h2 style={{margin:0}}>{copy.chooseMethodTitle}</h2><button type="button" className="secondary" disabled={!collectionMethod||browserBusy} onClick={resetCollection}><RotateCcw size={16}/>{copy.resetCollection}</button></div><p>{copy.chooseMethodText}</p><div className="hint" role="note"><ShieldCheck size={20}/><p><strong>{copy.collectionTitle}</strong><br/>{copy.collectionText}</p></div>

  {!collectionMethod&&<div className="choice-row"><button type="button" className="option" onClick={()=>selectCollectionMethod("mobile")}><Smartphone size={26}/><small style={{color:"var(--green)",fontWeight:800,letterSpacing:1}}>{copy.noComputerBadge}</small><strong>{copy.noComputerTitle}</strong><small style={{lineHeight:1.5}}>{copy.noComputerDescription}</small></button><button type="button" className="option" disabled={!desktop} aria-disabled={!desktop} onClick={()=>desktop&&selectCollectionMethod("browser")}><Cable size={26}/><small style={{color:"var(--green)",fontWeight:800,letterSpacing:1}}>{copy.browserBadge}</small><strong>{copy.browserTitle}</strong><small style={{lineHeight:1.5}}>{desktop?copy.browserDescription:copy.browserUnavailable}</small></button></div>}

  {collectionMethod==="mobile"&&<><a href="/guide" target="_blank" rel="noreferrer" className="guide-link" onClick={prepareMobileGuide}><Smartphone size={28}/><span><small style={{color:"var(--green)",fontWeight:700,letterSpacing:1}}>{copy.noComputerBadge}</small><strong>{copy.noComputerGuide}</strong><small>{copy.noComputerDescription}</small></span><ArrowRight size={18}/></a><span className="manual-evidence-title">{tx("manualFiles")}</span><label className="dropzone"><UploadCloud size={34}/><strong>{tx("chooseFiles")}</strong><input type="file" multiple accept=".png,.jpg,.jpeg,.mp4,.txt,.zip,.log,.xml,.prop,.csv" onChange={(e)=>addFiles(Array.from(e.target.files||[]))}/></label>{files.map((file,index)=><div className="file-row" key={`${file.name}-${file.size}-${index}`}><FileText size={18}/><span>{file.name}</span><button type="button" onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))}>{tx("remove")}</button></div>)}</>}

  {collectionMethod==="browser"&&files.length===0&&<TrackedBrowserCapture onBusyChange={setBrowserBusy} onFiles={handleBrowserFiles} onDeviceInfo={(info)=>setForm((current)=>({...current,brand:["infinix","tecno","itel"].includes(info.brand.toLowerCase())?info.brand.toLowerCase():current.brand,model:info.model||current.model,build:info.build||current.build}))}/>}
  {collectionMethod==="browser"&&files.length>0&&<div className="usb-complete"><ShieldCheck size={22}/><div><strong>{copy.automaticEvidence}</strong><small>{files.length} {files.length===1?copy.fileSingle:copy.filePlural}</small></div></div>}
  </>}

  {step===3&&<><h2>{tx("contactTitle")}</h2><p>{hardware?copy.hardwareContactText:copy.softwareContactText}</p><label>{requiredLabel(tx("name"))}<input {...requiredProps("name")} autoComplete="name" minLength={2} maxLength={100} placeholder={tx("name")} value={form.name} onChange={(e)=>field("name",e.target.value)}/></label><label>{requiredLabel(tx("email"))}<input {...requiredProps("email")} type="email" autoComplete="email" maxLength={180} placeholder={tx("email")} value={form.email} onChange={(e)=>field("email",e.target.value)}/></label><label>{requiredLabel(tx("phone"))}<input {...requiredProps("phone")} type="tel" autoComplete="tel" minLength={6} maxLength={30} placeholder={tx("phonePlaceholder")} value={form.phone} onChange={(e)=>field("phone",e.target.value)}/></label>

  {hardware&&<><label>{requiredLabel(tx("country"))}<input {...requiredProps("country")} minLength={2} maxLength={80} placeholder={tx("country")} value={form.country} onChange={(e)=>{field("country",e.target.value);setPostalMessage("");}}/></label>
  <label>{requiredLabel(tx("postalCode"))}<div style={{display:"flex",gap:10,alignItems:"end"}}><input {...requiredProps("postalCode")} inputMode={brazil?"numeric":"text"} autoComplete="postal-code" maxLength={20} placeholder={tx("postalPlaceholder")} value={form.postalCode} onChange={(e)=>field("postalCode",brazil?formatCep(e.target.value):e.target.value)} onBlur={()=>{if(brazil&&form.postalCode.replace(/\D/g,"").length===8&&!form.street)void lookupPostalCode();}}/>{brazil&&<button type="button" className="secondary" disabled={postalBusy} onClick={()=>void lookupPostalCode()}>{postalBusy?tx("postalSearching"):tx("postalSearch")}</button>}</div>{postalMessage&&<small style={{display:"block",marginTop:6}}>{postalMessage}</small>}</label>
  <label>{requiredLabel(tx("street"))}<input {...requiredProps("street")} autoComplete="address-line1" minLength={2} maxLength={180} placeholder={tx("street")} value={form.street} onChange={(e)=>field("street",e.target.value)}/></label><label>{requiredLabel(tx("number"))}<input {...requiredProps("addressNumber")} maxLength={30} placeholder={tx("number")} value={form.addressNumber} onChange={(e)=>field("addressNumber",e.target.value)}/></label><label>{tx("complement")} <em>{tx("addressOptional")}</em><input autoComplete="address-line2" maxLength={120} placeholder={tx("complement")} value={form.addressComplement} onChange={(e)=>field("addressComplement",e.target.value)}/></label><label>{tx("neighborhood")} <em>{tx("addressOptional")}</em><input maxLength={120} placeholder={tx("neighborhood")} value={form.neighborhood} onChange={(e)=>field("neighborhood",e.target.value)}/></label><label>{requiredLabel(tx("city"))}<input {...requiredProps("city")} autoComplete="address-level2" minLength={2} maxLength={100} placeholder={tx("city")} value={form.city} onChange={(e)=>field("city",e.target.value)}/></label><label>{requiredLabel(tx("state"))}<input {...requiredProps("state")} autoComplete="address-level1" minLength={1} maxLength={100} placeholder={tx("state")} value={form.state} onChange={(e)=>field("state",e.target.value)}/></label></>}

  <label className="consent" style={invalidFields.includes("consent")?{color:"#ff8093"}:undefined}><input required type="checkbox" checked={form.consent} onInvalid={(e)=>{e.preventDefault();markInvalid("consent");}} onClick={()=>clearInvalid("consent")} onChange={(e)=>field("consent",e.target.checked)}/><span>{tx("consent")}</span></label></>}

  {error&&<p className="error" role="alert" aria-live="assertive">{error}</p>}
  <div className="form-actions">{step>0?<button type="button" className="text-action" disabled={step===2&&!hardware&&browserBusy} onClick={()=>{if(step===2&&!hardware&&browserBusy){setError(copy.resetBlocked);return;}setError("");setStep(step-1);}}><ArrowLeft size={17}/>{tx("back")}</button>:<small>Aftercare</small>}{showPrimary&&<button className="primary" disabled={busy||postalBusy}>{busy?tx("sending"):step===3?tx("submit"):tx("continue")}</button>}</div>
  </form></div></section>;
}
