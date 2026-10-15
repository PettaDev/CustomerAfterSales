import { useEffect, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ChevronDown, Globe2, Headphones, Menu, Moon, Plus, ShieldCheck, Sun, X } from "lucide-react";
import CustomerFlow from "./portal/CustomerFlowV2";
import { initPortalLanguage, portalLanguages, portalText as tx, setPortalLanguage } from "./portal/portal-i18n";
import { portalUi } from "./portal/portal-ui-i18n";
import "./portal/portal.css";

const MobileGuide = lazy(() => import("./GuideApp"));
const Dashboard = lazy(() => import("./portal/Cases").then((module) => ({ default: module.Dashboard })));
const Tracking = lazy(() => import("./portal/Cases").then((module) => ({ default: module.Tracking })));
// Keep the navigation vocabulary consistent with the public static Help Center.
const navigationCopy = (language: string) => {
  if (language.startsWith("pt")) return { help: "Central de Ajuda", track: "Acompanhar caso", create: "Novo atendimento", locations: "Pontos de apoio", openMenu: "Abrir menu", closeMenu: "Fechar menu", light: "Ativar tema claro", dark: "Ativar tema escuro" };
  if (language.startsWith("es")) return { help: "Centro de Ayuda", track: "Seguir mi caso", create: "Nuevo caso", locations: "Puntos de apoyo", openMenu: "Abrir menú", closeMenu: "Cerrar menú", light: "Activar tema claro", dark: "Activar tema oscuro" };
  if (language.startsWith("zh")) return { help: "帮助中心", track: "查询服务单", create: "新建服务单", locations: "线下支持点", openMenu: "打开菜单", closeMenu: "关闭菜单", light: "切换浅色模式", dark: "切换深色模式" };
  return { help: "Help Center", track: "Track my case", create: "Open a case", locations: "Support locations", openMenu: "Open menu", closeMenu: "Close menu", light: "Use light theme", dark: "Use dark theme" };
};
const initialTheme = (): "light" | "dark" => {
  try { return localStorage.getItem("brte-theme") === "dark" ? "dark" : "light"; }
  catch { return "light"; }
};


export default function App() {
  const { i18n } = useTranslation();
  const ui = portalUi(i18n.resolvedLanguage || i18n.language || "en");
  const nav = navigationCopy(i18n.resolvedLanguage || i18n.language || "en");
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.brteTheme = theme;
    try { localStorage.setItem("brte-theme", theme); } catch { /* private storage */ }
  }, [theme]);
  const routePage = () => location.pathname === "/" ? "customer" : location.pathname.slice(1);
  const [page, setPage] = useState(routePage);
  const navigate = (p: string) => {
    history.pushState({}, "", p === "customer" ? "/" : "/" + p);
    setPage(p);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    initPortalLanguage();
    const fn = () => { setPage(routePage()); setMenuOpen(false); };
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);

  const fallback = <p style={{ padding: 24 }}>{ui.loading}</p>;

  // The original full Termux / wireless-debugging guide is an independent
  // workflow. Render it in its own shell instead of a placeholder page.
  if (page === "guide") return <Suspense fallback={fallback}><MobileGuide /></Suspense>;

  return <div className="portal" data-theme={theme}>
    <header className="brte-site-header">
      <div className="brte-header-inner">
        <a href="/" className="brte-brand" onClick={(event)=>{event.preventDefault();navigate("customer");}}>
          <span className="brte-brand-mark" aria-hidden="true"><Headphones size={22}/></span>
          <span className="brte-brand-type"><span className="brte-brand-name">BR<strong>TE</strong></span><small>TRANSSION · {tx("supportLabel")}</small></span>
        </a>
        <nav id="brte-primary-nav" className={`brte-nav ${menuOpen ? "is-open" : ""}`} aria-label={tx("mainNavigation")}>
          <a href="/ajuda/" onClick={()=>setMenuOpen(false)}>{nav.help}</a>
          <a href="/pontos-de-apoio/" onClick={()=>setMenuOpen(false)}>{nav.locations}</a>
          <a href="/tracking" aria-current={page==="tracking"?"page":undefined} onClick={(event)=>{event.preventDefault();navigate("tracking");}}>{nav.track}</a>
          <a href="/" className="brte-mobile-cta" aria-current={page==="customer"?"page":undefined} onClick={(event)=>{event.preventDefault();navigate("customer");}}>{nav.create}</a>
        </nav>
        <div className="brte-header-actions">
          <details className="brte-language-menu"><summary aria-label={tx("language")}><Globe2 aria-hidden="true" size={17}/><span>{portalLanguages.find(([code])=>code === i18n.language)?.[1] || "English"}</span><ChevronDown size={15} aria-hidden="true"/></summary><div className="brte-language-options" role="group" aria-label={tx("language")}>{portalLanguages.map(([code,label])=><button type="button" key={code} lang={code} aria-current={i18n.language===code?"true":undefined} onClick={event=>{void setPortalLanguage(code); event.currentTarget.closest("details")?.removeAttribute("open");}}>{label}<span aria-hidden="true">{i18n.language===code?"✓":""}</span></button>)}</div></details>
          <button type="button" className="brte-theme-toggle" onClick={()=>setTheme(current=>current==="light"?"dark":"light")} aria-label={theme==="light"?nav.dark:nav.light} title={theme==="light"?nav.dark:nav.light}>{theme==="light"?<Moon size={18}/>:<Sun size={18}/>}</button>
          <a href="/" className="brte-header-cta" onClick={(event)=>{event.preventDefault();navigate("customer");}}><Plus size={16}/>{nav.create}<ArrowUpRight size={16}/></a>
          <button type="button" className="brte-menu-toggle" aria-label={menuOpen?nav.closeMenu:nav.openMenu} aria-expanded={menuOpen} aria-controls="brte-primary-nav" onClick={()=>setMenuOpen(current=>!current)}>{menuOpen?<X size={20}/>:<Menu size={20}/>}</button>
        </div>
      </div>
    </header>
    <main>
      {page==="customer"?<CustomerFlow navigate={navigate}/>:page==="tracking"?<Suspense fallback={fallback}><Tracking/></Suspense>:page==="dashboard"?<Suspense fallback={fallback}><Dashboard/></Suspense>:page==="privacy"?<section className="narrow"><ShieldCheck size={36}/><h1>{tx("privacy")}</h1><div className="panel"><h2>{ui.privacyTitle}</h2><p>{ui.privacyP1}</p><p>{ui.privacyP2}</p></div></section>:page === "capture"?<section className="narrow"><ShieldCheck size={36}/><h1>{tx("advancedCollectionTitle")}</h1><div className="panel"><p>{tx("advancedCollectionText")}</p><p>{tx("advancedCollectionNext")}</p><a className="primary" href="/">{tx("advancedCollectionBack")}</a></div></section>:<section className="narrow"><h1>404</h1><a href="/">{tx("back")}</a></section>}
    </main>
    <footer className="brte-unified-footer" aria-label="BRTE">
      <div className="brte-footer-inner">
        <div className="brte-footer-top">
          <div className="brte-footer-identity">
            <a className="brte-footer-wordmark" href="/" onClick={(event)=>{event.preventDefault();navigate("customer");}}>BR<span>TE</span></a>
            <p>{tx("footerSupport")}</p>
            <p className="brte-footer-brands">Infinix · TECNO · itel</p>
          </div>
          <nav className="brte-footer-navigation" aria-label={tx("footerNavigation")}>
            <h2>{tx("footerNavigation")}</h2>
            <a href="/ajuda/">{nav.help}</a>
            <a href="/pontos-de-apoio/">{nav.locations}</a>
            <a href="/tracking" onClick={(event)=>{event.preventDefault();navigate("tracking");}}>{nav.track}</a>
            <a href="/" onClick={(event)=>{event.preventDefault();navigate("customer");}}>{nav.create}</a>
          </nav>
          <nav className="brte-footer-navigation" aria-label={tx("footerInformation")}>
            <h2>{tx("footerInformation")}</h2>
            <a href="/privacy/">{tx("privacy")}</a>
            <a href="/cookies/">{tx("footerCookies")}</a>
            <a href="/dashboard" onClick={(event)=>{event.preventDefault();navigate("dashboard");}}>{tx("teamAccess")}</a>
          </nav>
        </div>
        <div className="brte-footer-bottom"><span>© BRTE · TRANSSION</span><span>{tx("developerCredit")}</span></div>
      </div>
    </footer>
  </div>;
}
