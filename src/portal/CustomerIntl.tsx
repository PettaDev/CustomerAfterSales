import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import BrowserCapture from "./BrowserCapture";
import { api, post, upload } from "./api";
import { portalText as tx } from "./portal-i18n";

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export default function CustomerIntl({ navigate }: { navigate: (p: string) => void }) {
  useTranslation();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>();
  const [copied, setCopied] = useState(false);
  const [postalBusy, setPostalBusy] = useState(false);
  const [postalMessage, setPostalMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [form, setForm] = useState({
    brand: "infinix",
    model: "",
    build: "",
    category: "software",
    problem: "",
    description: "",
    expected: "",
    carrier: "",
    name: "",
    email: "",
    phone: "",
    country: "Brasil",
    postalCode: "",
    street: "",
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
    city: "",
    state: "",
    consent: false,
  });

  const field = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));
  const desktop = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const steps = [tx("device"), tx("issue"), tx("collection"), tx("details")];
  const brazil = /^(brasil|brazil)$/i.test(form.country.trim());

  const markInvalid = (key: string) =>
    setInvalidFields((current) => current.includes(key) ? current : [...current, key]);
  const clearInvalid = (key: string) =>
    setInvalidFields((current) => current.filter((item) => item !== key));
  const requiredLabel = (label: string) => (
    <>{label} <span aria-hidden="true" style={{ color: "#ff6b81" }}>*</span></>
  );
  const requiredProps = (key: string) => ({
    required: true,
    "aria-invalid": invalidFields.includes(key) || undefined,
    onInvalid: (event: any) => {
      event.preventDefault();
      markInvalid(key);
    },
    onFocus: () => clearInvalid(key),
    onClick: () => clearInvalid(key),
    style: invalidFields.includes(key)
      ? {
          borderColor: "#ff5c73",
          boxShadow: "0 0 0 1px rgba(255, 92, 115, 0.28)",
        }
      : undefined,
  });

  const addFiles = (incoming: File[]) => {
    if (incoming.some((x) => !x.size || x.size > 1024 ** 3)) {
      setError("Invalid file size.");
      return;
    }
    setFiles((x) => [...x, ...incoming]);
    setError("");
  };

  async function lookupPostalCode() {
    if (!brazil) return;
    const digits = form.postalCode.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) {
      setPostalMessage(tx("postalInvalid"));
      markInvalid("postalCode");
      return;
    }
    setPostalBusy(true);
    setPostalMessage("");
    try {
      const data = await api<any>(`/postal/br/${digits}`);
      setForm((current) => ({
        ...current,
        postalCode: formatCep(data.postalCode || digits),
        street: data.street || current.street,
        neighborhood: data.neighborhood || current.neighborhood,
        city: data.city || current.city,
        state: data.state || current.state,
        addressComplement:
          current.addressComplement || data.addressComplement || "",
      }));
      clearInvalid("postalCode");
      setPostalMessage(tx("postalFound"));
    } catch (e) {
      markInvalid("postalCode");
      setPostalMessage((e as Error).message);
    } finally {
      setPostalBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      let r = result;
      if (!r) {
        r = await api("/cases", post(form));
        setResult(r);
        sessionStorage.setItem(
          "case-access",
          JSON.stringify({ id: r.case.id, token: r.accessToken }),
        );
      }
      for (const file of files) await upload(r.case.id, r.accessToken, file);
      setFiles([]);
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step === 4)
    return (
      <section className="customer-wrap">
        <div className="success-card">
          <span className="success-icon"><CheckCircle2 size={44} /></span>
          <h1>{tx("received")}</h1>
          <p>{tx("receivedText")}</p>
          <div className="access-box">
            <small>{tx("protocol")}</small>
            <strong>{result.case.id}</strong>
            <small>{tx("accessCode")}</small>
            <code>{result.accessToken}</code>
          </div>
          <button
            className="primary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${result.case.id}\n${result.accessToken}`,
              );
              setCopied(true);
            }}
          >
            <Copy size={17} />{copied ? tx("copied") : tx("copy")}
          </button>
          <button className="secondary" onClick={() => navigate("tracking")}>
            {tx("track")}<ArrowRight size={17} />
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </section>
    );

  return (
    <section className="customer-wrap">
      <div className="intro">
        <span className="eyebrow">AFTERCARE · TRANSSION</span>
        <h1>{tx("intro")}</h1>
        <p>{tx("introText")}</p>
      </div>
      <div className="customer-layout">
        <aside className="journey">
          <span className="eyebrow">AFTERCARE</span>
          {steps.map((s, i) => (
            <div
              key={s}
              className={`journey-step ${step === i ? "current" : step > i ? "done" : ""}`}
            >
              <span>{step > i ? <Check size={16} /> : String(i + 1).padStart(2, "0")}</span>
              <div><strong>{s}</strong></div>
            </div>
          ))}
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <p>Privacy-first diagnostic collection.</p>
          </div>
        </aside>

        <form
          className="form-card"
          onSubmit={(e) => {
            e.preventDefault();
            step < 3 ? setStep(step + 1) : void submit();
          }}
        >
          <div className="step-heading">
            <span>{tx("step", { n: step + 1 })}</span>
            <small>{Math.round((step + 1) * 25)}%</small>
          </div>
          <div className="progress"><i style={{ width: `${(step + 1) * 25}%` }} /></div>

          {step === 0 && <>
            <h2>{tx("device")}</h2>
            <div className="brand-options">
              {["infinix", "tecno", "itel"].map((b) => (
                <button
                  type="button"
                  key={b}
                  className={form.brand === b ? "selected" : ""}
                  onClick={() => field("brand", b)}
                >
                  <img src={`/brandmarks/${b}.svg`} alt={b} />
                  <span className="radio-mark">{form.brand === b && <Check size={12} />}</span>
                </button>
              ))}
            </div>
            <label>
              {requiredLabel(tx("model"))}
              <input {...requiredProps("model")} minLength={2} maxLength={100} placeholder={tx("model")} value={form.model} onChange={(e) => field("model", e.target.value)} />
            </label>
            <label>
              {requiredLabel(tx("software"))}
              <input {...requiredProps("build")} maxLength={180} placeholder={tx("software")} value={form.build} onChange={(e) => field("build", e.target.value)} />
            </label>
          </>}

          {step === 1 && <>
            <h2>{tx("issue")}</h2>
            <div className="choice-row">
              {["software", "hardware"].map((x) => (
                <button type="button" key={x} className={`option ${form.category === x ? "selected" : ""}`} onClick={() => field("category", x)}><strong>{x}</strong></button>
              ))}
            </div>
            <label>
              {requiredLabel(tx("problem"))}
              <input {...requiredProps("problem")} minLength={5} maxLength={180} placeholder={tx("problem")} value={form.problem} onChange={(e) => field("problem", e.target.value)} />
            </label>
            <label>
              {requiredLabel(tx("reproduce"))}
              <textarea {...requiredProps("description")} minLength={15} maxLength={5000} rows={4} placeholder={tx("reproduce")} value={form.description} onChange={(e) => field("description", e.target.value)} />
            </label>
            <label>{tx("expected")}<input maxLength={1000} placeholder={tx("expected")} value={form.expected} onChange={(e) => field("expected", e.target.value)} /></label>
            <label>{tx("carrier")}<input maxLength={80} placeholder={tx("carrier")} value={form.carrier} onChange={(e) => field("carrier", e.target.value)} /></label>
          </>}

          {step === 2 && <>
            <h2>{desktop ? tx("captureDesktop") : tx("captureMobile")}</h2>
            {desktop && (
              <BrowserCapture
                onFiles={addFiles}
                onDeviceInfo={(info) =>
                  setForm((current) => ({
                    ...current,
                    brand: ["infinix", "tecno", "itel"].includes(info.brand.toLowerCase())
                      ? info.brand.toLowerCase()
                      : current.brand,
                    model: info.model || current.model,
                    build: info.build || current.build,
                  }))
                }
              />
            )}
            <span className="manual-evidence-title">{tx("manualFiles")}</span>
            <label className="dropzone">
              <UploadCloud size={34} />
              <strong>{tx("chooseFiles")}</strong>
              <input type="file" multiple accept=".png,.jpg,.jpeg,.mp4,.txt,.zip" onChange={(e) => addFiles(Array.from(e.target.files || []))} />
            </label>
            {files.map((f, i) => (
              <div className="file-row" key={f.name + i}>
                <FileText size={18} /><span>{f.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, n) => n !== i))}>{tx("remove")}</button>
              </div>
            ))}
          </>}

          {step === 3 && <>
            <h2>{tx("contactTitle")}</h2>
            <p>{tx("contactText")}</p>
            <label>{requiredLabel(tx("name"))}<input {...requiredProps("name")} autoComplete="name" minLength={2} maxLength={100} placeholder={tx("name")} value={form.name} onChange={(e) => field("name", e.target.value)} /></label>
            <label>{requiredLabel(tx("email"))}<input {...requiredProps("email")} type="email" autoComplete="email" maxLength={180} placeholder={tx("email")} value={form.email} onChange={(e) => field("email", e.target.value)} /></label>
            <label>{requiredLabel(tx("phone"))}<input {...requiredProps("phone")} type="tel" autoComplete="tel" minLength={6} maxLength={30} placeholder={tx("phonePlaceholder")} value={form.phone} onChange={(e) => field("phone", e.target.value)} /></label>
            <label>{requiredLabel(tx("country"))}<input {...requiredProps("country")} minLength={2} maxLength={80} placeholder={tx("country")} value={form.country} onChange={(e) => { field("country", e.target.value); setPostalMessage(""); }} /></label>

            <label>
              {requiredLabel(tx("postalCode"))}
              <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
                <input
                  {...requiredProps("postalCode")}
                  inputMode={brazil ? "numeric" : "text"}
                  autoComplete="postal-code"
                  maxLength={20}
                  placeholder={tx("postalPlaceholder")}
                  value={form.postalCode}
                  onChange={(e) => field("postalCode", brazil ? formatCep(e.target.value) : e.target.value)}
                  onBlur={() => { if (brazil && form.postalCode.replace(/\D/g, "").length === 8 && !form.street) void lookupPostalCode(); }}
                />
                {brazil && (
                  <button type="button" className="secondary" disabled={postalBusy} onClick={() => void lookupPostalCode()}>
                    {postalBusy ? tx("postalSearching") : tx("postalSearch")}
                  </button>
                )}
              </div>
              {postalMessage && <small style={{ display: "block", marginTop: 6 }}>{postalMessage}</small>}
            </label>

            <label>{requiredLabel(tx("street"))}<input {...requiredProps("street")} autoComplete="address-line1" minLength={2} maxLength={180} placeholder={tx("street")} value={form.street} onChange={(e) => field("street", e.target.value)} /></label>
            <label>{requiredLabel(tx("number"))}<input {...requiredProps("addressNumber")} maxLength={30} placeholder={tx("number")} value={form.addressNumber} onChange={(e) => field("addressNumber", e.target.value)} /></label>
            <label>{tx("complement")} <em>{tx("addressOptional")}</em><input autoComplete="address-line2" maxLength={120} placeholder={tx("complement")} value={form.addressComplement} onChange={(e) => field("addressComplement", e.target.value)} /></label>
            <label>{tx("neighborhood")} <em>{tx("addressOptional")}</em><input maxLength={120} placeholder={tx("neighborhood")} value={form.neighborhood} onChange={(e) => field("neighborhood", e.target.value)} /></label>
            <label>{requiredLabel(tx("city"))}<input {...requiredProps("city")} autoComplete="address-level2" minLength={2} maxLength={100} placeholder={tx("city")} value={form.city} onChange={(e) => field("city", e.target.value)} /></label>
            <label>{requiredLabel(tx("state"))}<input {...requiredProps("state")} autoComplete="address-level1" minLength={1} maxLength={100} placeholder={tx("state")} value={form.state} onChange={(e) => field("state", e.target.value)} /></label>

            <label className="consent" style={invalidFields.includes("consent") ? { color: "#ff8093" } : undefined}>
              <input required type="checkbox" checked={form.consent} onInvalid={(event) => { event.preventDefault(); markInvalid("consent"); }} onClick={() => clearInvalid("consent")} onChange={(e) => field("consent", e.target.checked)} />
              <span>{tx("consent")}</span>
            </label>
          </>}

          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            {step > 0
              ? <button type="button" className="text-action" onClick={() => setStep(step - 1)}><ArrowLeft size={17} />{tx("back")}</button>
              : <small>Aftercare</small>}
            <button className="primary" disabled={busy || postalBusy}>{busy ? tx("sending") : step === 3 ? tx("submit") : tx("continue")}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
