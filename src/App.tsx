import { useEffect, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Headphones, ShieldCheck } from "lucide-react";
import CustomerIntl from "./portal/CustomerIntlDeviceGuide";
import Capture from "./portal/Capture";
import { Dashboard, Tracking } from "./portal/Cases";
import { initPortalLanguage, portalLanguages, portalText as tx, setPortalLanguage } from "./portal/portal-i18n";
import { portalUi } from "./portal/portal-ui-i18n";
import "./portal/portal.css";

const GuideApp = lazy(() => import("./GuideApp"));

export default function App() {
  const { i18n } = useTranslation();
  const ui = portalUi(i18n.resolvedLanguage || i18n.language || "en");
  const [page, setPage] = useState(location.pathname.slice(1) || "customer");
  const navigate = (p: string) => {
    history.pushState({}, "", p === "customer" ? "/" : "/" + p);
    setPage(p);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    initPortalLanguage();
    const fn = () => setPage(location.pathname.slice(1) || "customer");
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);

  if (page === "guide") return <><a className="return-portal" href="/">← {tx("back")}</a><Suspense fallback={<p>{ui.loading}</p>}><GuideApp /></Suspense></>;

  return <div className="portal">
    <header className="portal-header">
      <a href="/" className="portal-logo" onClick={(e)=>{e.preventDefault();navigate("customer")}}>
        <span><Headphones size={23}/></span><div>after<span>care</span><small>TRANSSION · CUSTOMER SUPPORT</small></div>
      </a>
      <nav aria-label="Main navigation">
        <a href="/" className={page==="customer"?"active":""} onClick={(e)=>{e.preventDefault();navigate("customer")}}>{tx("newCase")}</a>
        <a href="/tracking" className={page==="tracking"?"active":""} onClick={(e)=>{e.preventDefault();navigate("tracking")}}>{tx("myCase")}</a>
      </nav>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <label style={{margin:0,display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:400}}><span>{tx("language")}</span><select aria-label={tx("language")} value={i18n.language} onChange={(e)=>void setPortalLanguage(e.target.value)} style={{width:"auto",margin:0,minHeight:40,padding:"8px 10px"}}>{portalLanguages.map(([code,label])=><option value={code} key={code}>{label}</option>)}</select></label>
        <a className={"staff-link "+(page==="dashboard"?"active":"")} href="/dashboard" onClick={(e)=>{e.preventDefault();navigate("dashboard")}}>{tx("tfae")} <ArrowUpRight size={16}/></a>
      </div>
    </header>
    <main>
      {page==="customer"?<CustomerIntl navigate={navigate}/>:page==="tracking"?<Tracking/>:page==="capture"?<Capture/>:page==="dashboard"?<Dashboard/>:page==="privacy"?<section className="narrow"><ShieldCheck size={36}/><h1>{tx("privacy")}</h1><div className="panel"><h2>{ui.privacyTitle}</h2><p>{ui.privacyP1}</p><p>{ui.privacyP2}</p></div></section>:<section className="narrow"><h1>404</h1><a href="/">{tx("back")}</a></section>}
    </main>
    <footer className="portal-footer"><div className="footer-brands"><span>Infinix</span><span>TECNO</span><span>itel</span></div><span>Customer After-Sales · TFAE</span><a href="/privacy" onClick={(e)=>{e.preventDefault();navigate("privacy")}}><ShieldCheck size={15}/>{tx("privacy")}</a></footer>
  </div>;
}
