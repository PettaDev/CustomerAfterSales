/** Build-time, review-gated SEO pages for confirmed known issues.
 * No external fetches, customer details, Jira keys or secrets are published.
 * Runs before Vite copies public files; output folder is GENERATED ONLY.
 */
import { readFile,writeFile,mkdir,rm } from "node:fs/promises";
import { resolve } from "node:path";

const root=resolve("public");
const folder=resolve(root,"ajuda/problemas-conhecidos");
const data=JSON.parse(await readFile(resolve("content/approved-known-issues.json"),"utf8"));
if(data.version!==1||!Array.isArray(data.issues))throw Error("Known issues registry version invalid");
const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const denyPrivate=value=>/\b(?:TOS\d{4}-\d+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\d{15})\b/i.test(value);
const refs=new Set();
const published=[];
for(const entry of data.issues){
 if(!entry||typeof entry!=="object")throw Error("Invalid issue entry");
 if(entry.publicationApproved!==true || entry.privacyReviewed!==true)continue;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug||"")||entry.slug.length>90)throw Error("Invalid approved slug");
 if(refs.has(entry.slug))throw Error("Duplicate approved slug");refs.add(entry.slug);
 for(const key of ["title","summary","workaround","approvedBy","privacyReviewedBy","approvedAt","updatedAt"]){
  if(typeof entry[key]!=="string"||!entry[key].trim())throw Error("Approved issue missing "+key);
 }
 if(entry.approvedBy===entry.privacyReviewedBy)throw Error("Require independent privacy review");
 if(!["investigating","workaround","resolved"].includes(entry.status))throw Error("Invalid approved issue status");
 if(!["infinix","tecno","itel"].includes(entry.brand))throw Error("Invalid brand");
 if(!Array.isArray(entry.models)||entry.models.length<1||entry.models.length>15||
    entry.models.some(m=>typeof m!=="string"||m.length>80))throw Error("Invalid models");
 if(!Number.isFinite(Date.parse(entry.updatedAt))||!Number.isFinite(Date.parse(entry.approvedAt)))
   throw Error("Invalid public dates");
 const publicData=[entry.slug,entry.title,entry.summary,entry.workaround,...entry.models].join(" ");
 if(denyPrivate(publicData))throw Error("Possible private information in approved issue");
 published.push(entry);
}
await rm(folder,{recursive:true,force:true});
await mkdir(folder,{recursive:true});
const home=await readFile(resolve(root,"ajuda/index.html"),"utf8");
const header=(home.match(/<header class="brte-site-header">[\s\S]*?<\/header>/)||[])[0];
if(!header)throw Error("Shared BRTE navbar missing");
const base="https://customers-guide.vercel.app";
const labels={investigating:"Em investigação",workaround:"Orientação temporária disponível",resolved:"Resolvido conforme validação técnica"};
const page=(title,description,relative,body,indexed=true,schema=null)=>{
 const canonical=base+relative;
 const ld=schema?'<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,"\\u003c")+'</script>':"";
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | BRTE</title><meta name="description" content="${esc(description)}">
<meta name="robots" content="${indexed?"index,follow":"noindex,follow"}">
<link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/brte-site.css">
<meta name="theme-color" content="#ffffff"><script src="/brte-site.js" defer></script><script src="/brte-known-issues.js" defer></script>${ld}
</head><body class="brte-help">${header}<main class="wrap">
<p id="known-language" class="brte-language-note" role="status" hidden></p><a href="/ajuda/" class="small">← Central de Ajuda</a>${body}
<footer class="foot"><a href="/privacy/">Privacidade</a> · <a href="/cookies/">Cookies</a> · <a href="/">Novo atendimento</a></footer>
</main></body></html>`;
};
const list=published.length?published.map(issue=>
 `<a class="card" href="/ajuda/problemas-conhecidos/${issue.slug}/">
 <h2>${esc(issue.title)}</h2><p>${esc(issue.summary)}</p>
 <span class="tag">${labels[issue.status]}</span></a>`).join(""):
 `<div class="panel"><h2>Nenhum problema confirmado publicado neste momento</h2>
 <p>Os problemas em investigação só aparecem após aprovação técnica e revisão de privacidade.</p></div>`;
const homeBody=`<p class="eyebrow">Atualizações oficiais revisadas</p>
<h1>Problemas conhecidos e em acompanhamento</h1>
<p class="sub">Consulte apenas informações aprovadas para publicação. Esta página não contém tickets Jira, evidências ou dados de clientes.</p>
<div class="grid">${list}</div><p>Não encontrou seu caso? <a href="/">Registre um atendimento ↗</a></p>`;
await writeFile(resolve(folder,"index.html"),page("Problemas conhecidos",
 "Informações públicas e revisadas sobre problemas confirmados em produtos Infinix, TECNO e itel.",
 "/ajuda/problemas-conhecidos/",homeBody,published.length>0),"utf8");
for(const issue of published){
 const sub=resolve(folder,issue.slug);
 await mkdir(sub,{recursive:true});
 const uri="/ajuda/problemas-conhecidos/"+issue.slug+"/";
 const description=issue.summary.slice(0,160);
 const body=`<p class="eyebrow">${esc(issue.brand.toUpperCase())} · ${labels[issue.status]}</p>
<h1>${esc(issue.title)}</h1><div class="panel">
<h2>Situação: ${labels[issue.status]}</h2>
<p><strong>Modelos relacionados:</strong> ${esc(issue.models.join(", "))}</p>
<p>${esc(issue.summary)}</p><h2>Orientação aprovada</h2><p>${esc(issue.workaround)}</p>
<small>Atualizado em: ${esc(issue.updatedAt.slice(0,10))}</small></div>
<p>O comportamento pode depender da região e versão do software. Caso continue, <a href="/?category=software&amp;problem=${encodeURIComponent(issue.title)}">abra um atendimento no BRTE ↗</a>.</p>`;
 const schema={"@context":"https://schema.org","@type":"TechArticle",headline:issue.title,
  description:issue.summary,dateModified:issue.updatedAt,mainEntityOfPage:base+uri,inLanguage:"pt-BR"};
 await writeFile(resolve(sub,"index.html"),page(issue.title,description,uri,body,true,schema),"utf8");
}
// Ensure sitemap includes generated, approved-only public articles for search crawlers.
const sitemapPath=resolve(root,"sitemap.xml");
let sitemap=await readFile(sitemapPath,"utf8");
sitemap=sitemap.replace(/\s*<!-- BRTE_KNOWN_ISSUES_START -->[\s\S]*?<!-- BRTE_KNOWN_ISSUES_END -->\s*/g,"");
const entries=published.length?["/ajuda/problemas-conhecidos/",...published.map(i=>"/ajuda/problemas-conhecidos/"+i.slug+"/")]:[];
const snippet=entries.map(path=>`  <url><loc>${base+path}</loc></url>`).join("\n");
sitemap=sitemap.replace("</urlset>",`<!-- BRTE_KNOWN_ISSUES_START -->\n${snippet}\n<!-- BRTE_KNOWN_ISSUES_END -->\n</urlset>`);
await writeFile(sitemapPath,sitemap,"utf8");
console.log("BRTE approved known issues generated: "+published.length+"; unapproved entries not published.");
