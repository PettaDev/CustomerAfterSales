import { ArrowRight, CheckCircle2, Download, FileArchive, ShieldCheck, Smartphone, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./collector-download.css";
import { mobileCollectorCopy } from "./collector-copy";

// Publish a validated, signed release APK at the path below before enabling
// downloads. Source-code ZIPs and debug builds must never be offered to customers.
const APK_RELEASE_PATH = "/downloads/brte-collector-release.apk";
const APK_RELEASE_READY = false;


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
