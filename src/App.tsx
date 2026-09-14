import { useState, useEffect, lazy, Suspense } from "react";
import { Headphones, ArrowUpRight, ShieldCheck } from "lucide-react";
const GuideApp = lazy(() => import("./GuideApp"));
import Customer from "./portal/Customer";
import Capture from "./portal/Capture";
import { Dashboard, Tracking } from "./portal/Cases";
import "./portal/portal.css";
export default function App() {
  const [page, setPage] = useState(location.pathname.slice(1) || "customer");
  const navigate = (p: string) => {
    history.pushState({}, "", p === "customer" ? "/" : "/" + p);
    setPage(p);
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const fn = () => setPage(location.pathname.slice(1) || "customer");
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);
  if (page === "guide")
    return (
      <>
        <a className="return-portal" href="/">
          ← Voltar ao portal de atendimento
        </a>
        <Suspense fallback={<p>Carregando guia…</p>}>
          <GuideApp />
        </Suspense>
      </>
    );
  return (
    <div className="portal">
      <header className="portal-header">
        <a
          href="/"
          className="portal-logo"
          onClick={(e) => {
            e.preventDefault();
            navigate("customer");
          }}
        >
          <span>
            <Headphones size={23} />
          </span>
          <div>
            after<span>care</span>
            <small>TRANSSION · CUSTOMER SUPPORT</small>
          </div>
        </a>
        <nav aria-label="Navegação principal">
          {[
            { id: "customer", label: "Novo atendimento" },
            { id: "tracking", label: "Meu caso" },
            { id: "capture", label: "Coleta assistida" },
          ].map((x) => (
            <a
              key={x.id}
              href={x.id === "customer" ? "/" : "/" + x.id}
              className={page === x.id ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigate(x.id);
              }}
            >
              {x.label}
            </a>
          ))}
        </nav>
        <a
          className={"staff-link " + (page === "dashboard" ? "active" : "")}
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          Área TFAE <ArrowUpRight size={16} />
        </a>
      </header>
      <main>
        {page === "customer" ? (
          <Customer navigate={navigate} />
        ) : page === "tracking" ? (
          <Tracking />
        ) : page === "capture" ? (
          <Capture />
        ) : page === "dashboard" ? (
          <Dashboard />
        ) : page === "privacy" ? (
          <section className="narrow">
            <ShieldCheck size={36} />
            <h1>Seus dados no atendimento.</h1>
            <div className="panel">
              <h2>O que você compartilha</h2>
              <p>
                Nome, e-mail, país, informações do aparelho, descrição do
                problema e arquivos selecionados por você. Uma coleta assistida
                acrescenta a gravação da tela, registros técnicos e metadados do
                dispositivo.
              </p>
              <h2>Como são usados</h2>
              <p>
                Os dados são disponibilizados à equipe TFAE para analisar o
                problema e acompanhar este atendimento. Guarde seu código de
                acesso: ele permite consultar o caso e enviar evidências.
              </p>
              <h2>Antes de gravar</h2>
              <p>
                Feche conversas e aplicativos pessoais. Não mostre senhas,
                documentos ou informações de terceiros. A captura começa apenas
                após sua autorização.
              </p>
              <h2>Solicitações sobre os dados</h2>
              <p>
                Use o canal da equipe responsável pelo seu atendimento para
                solicitar revisão ou exclusão. A política de retenção e o
                contato do responsável devem ser definidos antes da operação
                pública com clientes.
              </p>
            </div>
          </section>
        ) : (
          <section className="narrow">
            <h1>Página não encontrada.</h1>
            <a href="/">Voltar ao atendimento</a>
          </section>
        )}
      </main>
      <footer className="portal-footer">
        <div className="footer-brands">
          <span>Infinix</span>
          <span>TECNO</span>
          <span>itel</span>
        </div>
        <span>Customer After-Sales · Gustavo Petta</span>
        <a
          href="/privacy"
          onClick={(e) => {
            e.preventDefault();
            navigate("privacy");
          }}
        >
          <ShieldCheck size={15} />
          Privacidade
        </a>
      </footer>
    </div>
  );
}
