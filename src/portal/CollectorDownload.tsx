import { AlertTriangle, ArrowRight, CheckCircle2, Download, FileArchive, LockKeyhole, ShieldCheck, Smartphone, Video, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./collector-download.css";
import { mobileCollectorCopy } from "./collector-copy";

// Do not enable until a signed, independently verified release APK is hosted,
// inspected and served successfully over HTTPS. Never publish a debug build.
const APK_RELEASE_PATH = "/downloads/brte-collector-release.apk";
const APK_RELEASE_READY = false;

export default function CollectorDownload() {
  const { i18n } = useTranslation();
  const copy = mobileCollectorCopy(i18n.resolvedLanguage || i18n.language || "en");

  return (
    <section className="brte-collector-page">
      <div className="brte-collector-hero">
        <div className="brte-collector-hero-content">
          <span className="eyebrow">{copy.badge} · BRTE Collector v0.8</span>
          <div className="brte-collector-brand"><span className="brte-collector-app-mark"><Smartphone size={26} aria-hidden="true" /></span><strong>BRTE Collector</strong></div>
          <h1>{copy.title}</h1>
          <p className="brte-collector-lead">{copy.lead}</p>
          <div className="brte-collector-download-card">
            <div className="brte-collector-release-details">
              <strong>{copy.cardTitle}</strong>
              <small><Wifi size={15} aria-hidden="true" /> Android 11+ · {copy.badge}</small>
            </div>
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
          {!APK_RELEASE_READY && <p className="brte-collector-release-note"><AlertTriangle size={17} aria-hidden="true" />{copy.releaseLabel}</p>}
        </div>
      </div>

      <div className="brte-collector-info-grid">
        <section className="brte-collector-panel" aria-labelledby="collector-requirements">
          <div className="brte-collector-heading"><Smartphone size={21} aria-hidden="true" /><h2 id="collector-requirements">{copy.requirementsTitle}</h2></div>
          <ul className="brte-collector-checklist">{copy.requirements.map((item,index)=><li key={index}><CheckCircle2 size={17} aria-hidden="true"/><span>{item}</span></li>)}</ul>
        </section>
        <section className="brte-collector-panel" aria-labelledby="collector-permissions">
          <div className="brte-collector-heading"><LockKeyhole size={21} aria-hidden="true" /><h2 id="collector-permissions">{copy.permissionTitle}</h2></div>
          <div className="brte-collector-permission-list">{copy.permissions.map((permission,index)=><div key={index}><strong>{permission.title}</strong><p>{permission.text}</p></div>)}</div>
        </section>
      </div>

      <section className="brte-collector-panel brte-collector-instructions" aria-labelledby="collector-instructions">
        <div className="brte-collector-heading"><CheckCircle2 size={22} aria-hidden="true"/><h2 id="collector-instructions">{copy.setupTitle}</h2></div>
        <div className="brte-collector-guide-grid">
          {copy.guides.map((guide,index)=><article className="brte-collector-step" key={index}>
            <div className="brte-collector-step-heading"><span className="brte-collector-step-number">{String(index+1).padStart(2,"0")}</span><h3>{guide.title}</h3></div>
            <ol>{guide.points.map((point,pointIndex)=><li key={pointIndex}>{point}</li>)}</ol>
          </article>)}
        </div>
        <div className="brte-collector-advice"><ShieldCheck size={21} aria-hidden="true"/><p>{copy.note}</p></div>
      </section>

      <section className="brte-collector-panel brte-collector-video-section" aria-labelledby="collector-videos">
        <div className="brte-collector-heading"><Video size={22} aria-hidden="true"/><h2 id="collector-videos">{copy.videoTitle}</h2></div>
        <p>{copy.videoNote}</p>
        {/* No broken media elements: players will be added only after real verified videos arrive. */}
      </section>

      <section className="brte-collector-bottom-grid">
        <div className="brte-collector-privacy"><ShieldCheck size={23} aria-hidden="true"/><div><h2>{copy.privacyTitle}</h2><p>{copy.privacyText}</p></div></div>
        <div className="brte-collector-return"><FileArchive size={25} aria-hidden="true"/><div><strong>{copy.uploadTitle}</strong><p>{copy.uploadDescription}</p><p>{copy.returnNote}</p><small>{copy.footerHint}</small></div></div>
      </section>

      <a className="brte-collector-help" href="/ajuda/">{copy.stepsTitle}<ArrowRight size={17} aria-hidden="true" /></a>
    </section>
  );
}
