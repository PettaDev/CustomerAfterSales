import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");
const slugs=["wifi-desconecta","aplicativo-fecha","rede-movel-sms","aquecimento-bateria","atualizacao-sistema"];
const htmlPaths=[
 "public/ajuda/index.html",
 "public/pontos-de-apoio/index.html",
 "public/privacy/index.html",
 "public/cookies/index.html",
 ...slugs.map(s=>"public/ajuda/"+s+"/index.html")
];

test("native select regression is forbidden on public pages and React navbar",async()=>{
 const [app,css,...pages]=await Promise.all([
   read("src/App.tsx"),read("public/brte-site.css"),...htmlPaths.map(read)
 ]);
 assert.match(app, /<details className="brte-language-menu">/);
 assert.doesNotMatch(app, /<label className="brte-language">/);
 assert.match(css, /\.brte-language-options/);
 assert.match(css, /background:#14243a/);
 assert.match(css, /color:#f5f8ff/);
 for(let i=0;i<htmlPaths.length;i++){
   assert.match(pages[i],/class="brte-language-menu"/,htmlPaths[i]+" needs readable language dropdown");
   assert.doesNotMatch(pages[i],/id="brte-language-select"/,htmlPaths[i]+" must not render native select");
 }
});

test("translated Q&A filter labels exist in EN, ES and ZH, and filter card IDs survive locale updates",async()=>{
 const [help,search,site, ...localeFiles]=await Promise.all([
  read("public/ajuda/index.html"),read("public/brte-help-search.js"),
  read("public/brte-site.js"),
  ...["en","es-419","zh-CN"].map(l=>read("public/brte-locales/"+l+".js"))
 ]);
 const ids=["all","wifi","app","network","battery","update"];
 for(const id of ids)assert.ok(help.includes('data-topic="'+id+'"'));
 for(const id of ids.slice(1))assert.ok(help.includes('data-topic-id="'+id+'"'));
 const context={window:{}};
 for(const script of localeFiles)vm.runInNewContext(script,context);
 for(const locale of ["en","es-419","zh-CN"]){
  for(const id of ids)assert.ok(context.window.BRTE_I18N_DATA[locale]["help.filter."+id],locale+"/"+id);
  assert.ok(context.window.BRTE_I18N_DATA[locale]["guide.checklistStatus"].includes("{done}"));
 }
 assert.match(search,/card\.dataset\.topicId===topic/);
 assert.match(search,/addEventListener\("brte:language",update\)/);
 assert.match(site,/dispatchEvent\(new CustomEvent\("brte:language"/);
});

test("each guide retains i18n content and private 4-step checklist",async()=>{
 const [script,...docs]=await Promise.all([
  read("public/brte-guide-checklist.js"),...slugs.map(s=>read("public/ajuda/"+s+"/index.html"))
 ]);
 assert.doesNotMatch(script,/\bfetch\(|\bsendBeacon\(|\bXMLHttpRequest\b/);
 assert.doesNotMatch(script,/(?:localStorage|sessionStorage)\.setItem/);
 assert.match(script,/addEventListener\("brte:language",update\)/);
 for(let i=0;i<docs.length;i++){
  const page=docs[i];
  assert.equal((page.match(/data-check-step="/g)||[]).length,4,slugs[i]);
  for(let step=1;step<=4;step++){
    assert.ok(page.includes('data-brte-text="guide.'+slugs[i]+'.step'+step+'"'));
  }
  assert.match(page,/data-brte-text="guide\.checklistIntro"/);
  assert.match(page,/src="\/brte-guide-checklist\.js"/);
  assert.match(page,/src="\/brte-content-i18n\.js"/);
  assert.match(page,/href="\/brte-help-improvements\.css"/);
 }
});
