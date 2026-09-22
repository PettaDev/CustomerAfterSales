import { useEffect, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Headphones, ShieldCheck } from "lucide-react";
import CustomerFlow from "./portal/CustomerFlowV2";
import { initPortalLanguage, portalLanguages, portalText as tx, setPortalLanguage } from "./portal/portal-i18n";
import { portalUi } from "./portal/portal-ui-i18n";
import "./portal/portal.css";

const Capture = lazy(() => import("./portal/Capture"));
const Dashboard = lazy(() => import("./portal/Cases").then((module) => ({ default: module.Dashboard })));
const Tracking = lazy(() => import("./portal/Cases").then((module) => ({ default: module.Tracking })));

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

  const fallback = <p style={{ padding: 24 }}>{ui.loading}</p>;

  if (page === "guide") return <div className="portal"><main><section className="narrow"><ShieldCheck size={36}/><h1>{tx("advancedCollectionTitle")}</h1><div className="panel"><p>{tx("advancedCollectionText")}</p><p>{tx("advancedCollectionNext")}</p><a className="primary" href="/">{tx("advancedCollectionBack")}</a></div></section></main></div>;

  return <div className="portal">
    <header className="portal-header">
      <a href="/" className="portal-logo" onClick={(e)=>{e.preventDefault();navigate("customer")}}>
        <span><Headphones size={23}/></span><div>BR<span>TE</span><small>TRANSSION · {tx("supportLabel")}</small></div>
      </a>
      <nav aria-label={tx("mainNavigation")}>
        <a href="/" className={page==="customer"?"active":""} onClick={(e)=>{e.preventDefault();navigate("customer")}}>{tx("newCase")}</a>
        <a href="/tracking" className={page==="tracking"?"active":""} onClick={(e)=>{e.preventDefault();navigate("tracking")}}>{tx("myCase")}</a>
      </nav>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <label style={{margin:0,display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:400}}><span>{tx("language")}</span><select aria-label={tx("language")} value={i18n.language} onChange={(e)=>void setPortalLanguage(e.target.value)} style={{width:"auto",margin:0,minHeight:40,padding:"8px 10px"}}>{portalLanguages.map(([code,label])=><option value={code} key={code}>{label}</option>)}</select></label>
        {page==="dashboard"&&<a className="staff-link active" href="/dashboard" onClick={(e)=>{e.preventDefault();navigate("dashboard")}}>{tx("tfae")}</a>}
      </div>
    </header>
    <main>
      {page==="customer"?<CustomerFlow navigate={navigate}/>:page==="tracking"?<Suspense fallback={fallback}><Tracking/></Suspense>:page==="capture"?<Suspense fallback={fallback}><Capture/></Suspense>:page==="dashboard"?<Suspense fallback={fallback}><Dashboard/></Suspense>:page==="privacy"?<section className="narrow"><ShieldCheck size={36}/><h1>{tx("privacy")}</h1><div className="panel"><h2>{ui.privacyTitle}</h2><p>{ui.privacyP1}</p><p>{ui.privacyP2}</p></div></section>:<section className="narrow"><h1>404</h1><a href="/">{tx("back")}</a></section>}
    </main>
    <footer className="portal-footer"><div className="footer-brands"><span>Infinix</span><span>TECNO</span><span>itel</span></div><span>{tx("footerSupport")}</span><a href="/privacy" onClick={(e)=>{e.preventDefault();navigate("privacy")}}><ShieldCheck size={15}/>{tx("privacy")}</a></footer>
  </div>;
}
