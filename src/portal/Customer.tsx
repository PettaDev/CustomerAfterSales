import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  FileText,
  Copy,
} from "lucide-react";
import { api, post, upload } from "./api";
import BrowserCapture from "./BrowserCapture";

const steps = ["Seu aparelho", "O problema", "Coleta", "Seus dados"];

export default function Customer({
  navigate,
}: {
  navigate: (p: string) => void;
}) {
  const [step, setStep] = useState(0),
    [files, setFiles] = useState<File[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<any>(null),
    [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    brand: "infinix",
    model: "",
    build: "",
    category: "software",
    problem: "",
    description: "",
    expected: "",
    name: "",
    email: "",
    country: "Brasil",
    carrier: "",
    consent: false,
  });
  const field = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));
  const desktop =
    typeof navigator !== "undefined" &&
    !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  async function submit() {
    setError("");
    setBusy(true);
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
      for (const file of files) {
        await upload(r.case.id, r.accessToken, file);
        setFiles((current) => current.filter((f) => f !== file));
      }
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
          <span className="success-icon">
            <CheckCircle2 size={44} />
          </span>
          <span className="eyebrow">PRÓXIMO PASSO: ANÁLISE TÉCNICA</span>
          <h1>Recebemos seu caso.</h1>
          <p>
            Seu relato e as evidências estão reunidos. Guarde o protocolo e o
            código para acompanhar as atualizações.
          </p>
          <div className="access-box">
            <small>Protocolo</small>
            <strong>{result.case.id}</strong>
            <small>Código de acesso privado</small>
            <code>{result.accessToken}</code>
          </div>
          <button
            className="primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  "Protocolo: " +
                    result.case.id +
                    "\nCódigo: " +
                    result.accessToken,
                );
                setCopied(true);
              } catch {
                setError("Copie o protocolo e o código manualmente.");
              }
            }}
          >
            <Copy size={17} />
            {copied ? "Copiado" : "Copiar dados de acesso"}
          </button>
          <button
            className="secondary"
            onClick={() => {
              sessionStorage.setItem(
                "case-access",
                JSON.stringify({
                  id: result.case.id,
                  token: result.accessToken,
                }),
              );
              navigate("tracking");
            }}
          >
            Acompanhar meu caso <ArrowRight size={17} />
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </section>
    );

  const addFiles = (incoming: File[]) => {
    if (incoming.some((x) => x.size > 1024 ** 3 || x.size === 0)) {
      setError("Cada arquivo deve ter entre 1 byte e 1 GB.");
      return;
    }
    setFiles((current) => [...current, ...incoming]);
    setError("");
  };

  return (
    <section className="customer-wrap">
      <div className="intro">
        <span className="eyebrow">SUPORTE AO SEU ALCANCE</span>
        <h1>
          Vamos cuidar
          <br />
          do seu aparelho<span>.</span>
        </h1>
        <p>
          Conte o que aconteceu. Nós organizamos as informações
          <br className="desktop" /> para ajudar você a dar o próximo passo.
        </p>
      </div>
      <div className="customer-layout">
        <aside className="journey">
          <span className="eyebrow">SEU ATENDIMENTO</span>
          {steps.map((s, i) => (
            <div
              className={
                "journey-step " +
                (step === i ? "current" : step > i ? "done" : "")
              }
              key={s}
            >
              <span>
                {step > i ? <Check size={16} /> : String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{s}</strong>
                <small>
                  {
                    [
                      "Marca, modelo e software",
                      "O que está acontecendo",
                      desktop ? "Conecte e reproduza" : "Fotos e vídeos",
                      "Contato para acompanhamento",
                    ][i]
                  }
                </small>
              </div>
            </div>
          ))}
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <p>
              A coleta começa somente com sua autorização e fica associada a
              este atendimento.
            </p>
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
            <span>ETAPA {step + 1} DE 4</span>
            <small>{Math.round(((step + 1) / 4) * 100)}%</small>
          </div>
          <div className="progress">
            <i style={{ width: ((step + 1) / 4) * 100 + "%" }} />
          </div>

          {step === 0 && (
            <>
              <h2>Qual é o seu aparelho?</h2>
              <p>Selecione a marca e informe os dados do telefone.</p>
              <div className="brand-options">
                {["infinix", "tecno", "itel"].map((b) => (
                  <button
                    type="button"
                    key={b}
                    aria-pressed={form.brand === b}
                    className={form.brand === b ? "selected" : ""}
                    onClick={() => field("brand", b)}
                  >
                    <img src={"/brandmarks/" + b + ".svg"} alt={b} />
                    <span className="radio-mark">
                      {form.brand === b && <Check size={12} />}
                    </span>
                  </button>
                ))}
              </div>
              <label>
                Modelo do aparelho
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ex.: NOTE 60 Pro ou X6878"
                  value={form.model}
                  onChange={(e) => field("model", e.target.value)}
                />
              </label>
              <label>
                Versão do software
                <input
                  required
                  minLength={1}
                  maxLength={180}
                  placeholder="Disponível em Configurações → Sobre o telefone"
                  value={form.build}
                  onChange={(e) => field("build", e.target.value)}
                />
              </label>
              <div className="hint">
                <Smartphone size={20} />
                <p>
                  O modelo e a versão do software ficam em{" "}
                  <strong>Configurações → Sobre o telefone</strong>.
                </p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>O que está acontecendo?</h2>
              <p>Quanto mais específico, melhor poderemos analisar.</p>
              <div className="choice-row">
                {[
                  { id: "software", label: "Sistema e aplicativos", icon: Layers },
                  { id: "hardware", label: "Parte física do aparelho", icon: Cpu },
                ].map((x) => (
                  <button
                    type="button"
                    className={"option " + (form.category === x.id ? "selected" : "")}
                    aria-pressed={form.category === x.id}
                    onClick={() => field("category", x.id)}
                    key={x.id}
                  >
                    <x.icon size={24} />
                    <strong>{x.label}</strong>
                  </button>
                ))}
              </div>
              <label>
                Resumo do problema
                <input
                  required
                  minLength={5}
                  maxLength={180}
                  placeholder="Ex.: A câmera fecha ao gravar um vídeo"
                  value={form.problem}
                  onChange={(e) => field("problem", e.target.value)}
                />
              </label>
              <label>
                Como podemos reproduzir?
                <textarea
                  required
                  minLength={15}
                  maxLength={5000}
                  rows={4}
                  placeholder="Descreva o que você faz, o que acontece e com que frequência."
                  value={form.description}
                  onChange={(e) => field("description", e.target.value)}
                />
              </label>
              <label>
                O que deveria acontecer? <em>Opcional</em>
                <input
                  maxLength={1000}
                  value={form.expected}
                  onChange={(e) => field("expected", e.target.value)}
                />
              </label>
              <label>
                Operadora <em>Se o problema envolve rede ou chamadas</em>
                <input
                  maxLength={80}
                  placeholder="Ex.: Vivo, Claro ou TIM"
                  value={form.carrier}
                  onChange={(e) => field("carrier", e.target.value)}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2>{desktop ? "Reproduza o problema." : "Mostre o que aconteceu."}</h2>
              <p>
                {desktop
                  ? "Conecte o celular com a depuração USB ativada. Não é necessário instalar nenhum programa."
                  : "Adicione fotos ou vídeos que mostrem o problema."}
              </p>

              {desktop && (
                <BrowserCapture
                  onFiles={addFiles}
                  onDeviceInfo={(info) => {
                    const brand = info.brand.toLowerCase();
                    setForm((current) => ({
                      ...current,
                      brand: ["infinix", "tecno", "itel"].includes(brand)
                        ? brand
                        : current.brand,
                      model: info.model || current.model,
                      build: info.build || current.build,
                    }));
                  }}
                />
              )}

              <div className={desktop ? "manual-evidence" : ""}>
                {desktop && <span className="manual-evidence-title">Ou envie arquivos que você já possui</span>}
                <label className="dropzone">
                  <UploadCloud size={34} />
                  <strong>Escolha seus arquivos</strong>
                  <span>PNG, JPG, MP4, TXT ou ZIP · até 1 GB por arquivo</span>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.mp4,.txt,.zip"
                    onChange={(e) => addFiles(Array.from(e.target.files || []))}
                  />
                </label>
              </div>

              {files.map((f, i) => (
                <div className="file-row" key={f.name + i}>
                  <FileText size={18} />
                  <span>
                    {f.name}
                    <small>{(f.size / 1024 / 1024).toFixed(1)} MB</small>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, n) => n !== i))}
                  >
                    Remover
                  </button>
                </div>
              ))}
              <div className="hint">
                <ShieldCheck size={20} />
                <p>
                  Antes de iniciar, feche conversas, senhas e documentos pessoais.
                  Compartilhe apenas o necessário para mostrar o problema.
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Como podemos falar com você?</h2>
              <p>Seus dados ficam associados a este atendimento.</p>
              <label>
                Seu nome
                <input
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={180}
                  value={form.email}
                  onChange={(e) => field("email", e.target.value)}
                />
              </label>
              <label>
                País
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.country}
                  onChange={(e) => field("country", e.target.value)}
                />
              </label>
              <div className="review-box">
                <strong>
                  {form.brand.toUpperCase()} · {form.model}
                </strong>
                <small>{form.build}</small>
                <p>{form.problem}</p>
                <span>{files.length} arquivo(s) de evidência</span>
              </div>
              <label className="consent">
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => field("consent", e.target.checked)}
                />
                <span>
                  Autorizo o uso dos dados e das evidências deste atendimento
                  para análise técnica. Li as{" "}
                  <a href="/privacy" target="_blank">
                    informações de privacidade
                  </a>
                  .
                </span>
              </label>
              {result && (
                <p>
                  Seu caso já foi criado. Guarde o protocolo {result.case.id} e
                  o código {result.accessToken}. A nova tentativa enviará as
                  evidências pendentes.
                </p>
              )}
            </>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            {step > 0 ? (
              <button
                type="button"
                className="text-action"
                disabled={busy}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={17} />
                Voltar
              </button>
            ) : (
              <small>Um passo de cada vez.</small>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Enviando…" : step === 3 ? "Enviar meu caso" : "Continuar"}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
