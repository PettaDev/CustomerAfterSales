import { ArrowRight, CheckCircle2, Download, FileArchive, ShieldCheck, Smartphone, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./collector-download.css";

// Publish a validated, signed release APK at the path below before enabling
// downloads. Source-code ZIPs and debug builds must never be offered to customers.
const APK_RELEASE_PATH = "/downloads/brte-collector-release.apk";
const APK_RELEASE_READY = false;

export function mobileCollectorCopy(language: string) {
  if (language.startsWith("pt")) return {
    badge: "SEM COMPUTADOR",
    title: "Baixe o BRTE Collector",
    lead: "Use nosso aplicativo Android para gravar o problema e coletar logs técnicos no próprio celular, sem computador ou Termux.",
    cardTitle: "BRTE Collector para Android",
    download: "Baixar aplicativo Android",
    unavailable: "Aplicativo em validação",
    unavailableNote: "O download será liberado quando o APK de release assinado for validado pela equipe.",
    stepsTitle: "Como coletar e enviar",
    steps: [
      "Instale o aplicativo Android quando o download estiver disponível.",
      "Siga o guia de pareamento e autorize a gravação da tela.",
      "Toque em Iniciar vídeo + logs e reproduza o problema.",
      "Finalize a coleta e localize o arquivo ZIP em Downloads/BRTE Collector.",
      "Volte à aba do atendimento BRTE e anexe o ZIP para enviar ao suporte.",
    ],
    note: "O aplicativo usa depuração sem fio e pode solicitar permissões do Android. Os logs podem conter informações pessoais.",
    returnNote: "Mantenha a aba do atendimento aberta. Após coletar, volte a ela e selecione o ZIP.",
    uploadTitle: "Já terminou a coleta?",
    uploadDescription: "Use o campo de anexos logo abaixo para enviar o ZIP gerado pelo BRTE Collector.",
    openPage: "Abrir página do aplicativo",
  };
  if (language.startsWith("es")) return {
    badge: "SIN COMPUTADORA",
    title: "Descarga BRTE Collector",
    lead: "Usa nuestra aplicación Android para grabar el problema y recopilar registros técnicos desde tu teléfono, sin computadora ni Termux.",
    cardTitle: "BRTE Collector para Android",
    download: "Descargar aplicación Android",
    unavailable: "Aplicación en validación",
    unavailableNote: "La descarga estará disponible cuando el equipo valide el APK de producción firmado.",
    stepsTitle: "Cómo recopilar y enviar",
    steps: [
      "Instala la aplicación Android cuando la descarga esté disponible.",
      "Sigue la guía de emparejamiento y autoriza la grabación de pantalla.",
      "Pulsa Iniciar vídeo + registros y reproduce el problema.",
      "Finaliza la recopilación y localiza el ZIP en Descargas/BRTE Collector.",
      "Vuelve a la pestaña del caso BRTE y adjunta el ZIP para enviarlo a soporte.",
    ],
    note: "La aplicación utiliza depuración inalámbrica y puede solicitar permisos de Android. Los registros pueden contener datos personales.",
    returnNote: "Mantén abierta la pestaña de tu caso. Cuando termines, vuelve y selecciona el ZIP.",
    uploadTitle: "¿Terminaste la recopilación?",
    uploadDescription: "Utiliza el campo de archivos adjuntos de abajo para enviar el ZIP generado.",
    openPage: "Abrir página de la aplicación",
  };
  if (language.startsWith("zh")) return {
    badge: "无需电脑",
    title: "下载 BRTE Collector",
    lead: "使用 Android 应用直接在手机上录屏并收集技术日志，无需电脑或 Termux。",
    cardTitle: "BRTE Collector Android 应用",
    download: "下载 Android 应用",
    unavailable: "应用正在验证中",
    unavailableNote: "正式版 APK 完成签名并通过测试后，将开放下载。",
    stepsTitle: "如何采集并提交",
    steps: [
      "下载开放后，在手机上安装 Android 应用。",
      "按照配对向导连接设备并授权录屏。",
      "点击开始视频及日志采集，然后复现问题。",
      "结束采集，在下载/BRTE Collector 中找到 ZIP 文件。",
      "返回 BRTE 服务单标签页，上传 ZIP 文件并提交。",
    ],
    note: "应用需要无线调试，并可能请求 Android 权限。日志可能包含个人信息。",
    returnNote: "请保留服务单标签页。采集完成后返回并选择 ZIP 文件。",
    uploadTitle: "采集完成了吗？",
    uploadDescription: "请使用下方的附件上传区域提交 BRTE Collector 生成的 ZIP。",
    openPage: "打开应用下载页",
  };
  return {
    badge: "NO COMPUTER",
    title: "Download BRTE Collector",
    lead: "Use our Android app to record the issue and collect technical logs directly on your phone, without a computer or Termux.",
    cardTitle: "BRTE Collector for Android",
    download: "Download Android app",
    unavailable: "App being validated",
    unavailableNote: "The download will become available once the signed release APK has passed validation.",
    stepsTitle: "How to collect and submit",
    steps: [
      "Install the Android app once the download is available.",
      "Follow the pairing guide and authorize full-screen recording.",
      "Tap Start video + logs and reproduce the issue.",
      "Finish the collection and find the ZIP in Downloads/BRTE Collector.",
      "Return to your BRTE case tab and attach the ZIP for support.",
    ],
    note: "The app uses wireless debugging and may request Android permissions. Logs may contain personal information.",
    returnNote: "Keep your case tab open. When finished, return to it and select the ZIP.",
    uploadTitle: "Finished collecting?",
    uploadDescription: "Use the attachment area below to upload the ZIP created by BRTE Collector.",
    openPage: "Open app download page",
  };
}

export default function CollectorDownload() {
  const { i18n } = useTranslation();
  const copy = mobileCollectorCopy(i18n.resolvedLanguage || i18n.language || "en");

  return (
    <section className="brte-collector-page">
      <div className="brte-collector-hero">
        <span className="eyebrow">{copy.badge}</span>
        <div className="brte-collector-brand"><Smartphone size={28} aria-hidden="true" /><span>BRTE Collector</span></div>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
        <div className="brte-collector-download-card">
          <div><strong>{copy.cardTitle}</strong><small>Android 11+</small></div>
          {APK_RELEASE_READY ? (
            <a className="brte-collector-download-button" href={APK_RELEASE_PATH} download>
              <Download size={19} aria-hidden="true" />{copy.download}
            </a>
          ) : (
            <div className="brte-collector-disabled">
              <button type="button" disabled><Download size={19} aria-hidden="true" />{copy.unavailable}</button>
              <small role="status">{copy.unavailableNote}</small>
            </div>
          )}
        </div>
      </div>
      <div className="brte-collector-instructions">
        <div className="brte-collector-heading"><Video size={23} aria-hidden="true" /><h2>{copy.stepsTitle}</h2></div>
        <ol>{copy.steps.map((step, index) => <li key={index}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
        <div className="brte-collector-advice"><ShieldCheck size={21} aria-hidden="true" /><p>{copy.note}</p></div>
        <div className="brte-collector-return"><FileArchive size={24} aria-hidden="true" /><p>{copy.returnNote}</p><CheckCircle2 size={20} aria-hidden="true" /></div>
        <a className="brte-collector-help" href="/ajuda/">{copy.stepsTitle}<ArrowRight size={17} aria-hidden="true" /></a>
      </div>
    </section>
  );
}
