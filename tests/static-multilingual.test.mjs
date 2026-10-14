import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const load = file => readFile(new URL("../"+file, import.meta.url),"utf8");
const pages=[
  "public/pontos-de-apoio/index.html",
  "public/ajuda/index.html",
  ...["wifi-desconecta","aplicativo-fecha","rede-movel-sms","aquecimento-bateria","atualizacao-sistema"].map(s=>"public/ajuda/"+s+"/index.html"),
];

const languageData=async()=>{
  const context={window:{}};
  for(const code of ["en","es-419","zh-CN"]) {
    const src=await load("public/brte-locales/"+code+".js");
    vm.runInNewContext(src, context, {filename:code+".js"});
  }
  return context.window.BRTE_I18N_DATA;
};

test("all published support screens have a translated string for every key in EN, ES and ZH",async()=>{
  const data=await languageData();
  for(const language of ["en","es-419","zh-CN"])assert.ok(Object.keys(data[language]).length>=100);
  for(const path of pages) {
    const html=await load(path);
    const keys=[...html.matchAll(/data-brte-(?:text|placeholder)="([^"]+)"/g)].map(x=>x[1]);
    assert.ok(keys.length>14,path+" must have translated content markers");
    for(const key of keys)for(const language of ["en","es-419","zh-CN"]) {
      assert.equal(typeof data[language][key],"string",language+" missing "+key+" on "+path);
      assert.ok(data[language][key].trim(),language+" has empty "+key);
    }
    for(const script of ["en.js","es-419.js","zh-CN.js"])assert.ok(html.includes("/brte-locales/"+script));
    assert.ok(html.includes('src="/brte-content-i18n.js"'));
    assert.ok(html.includes('class="brte-language-menu"'));
    assert.ok(!html.includes('id="brte-language-select"'));
  }
});

test("custom Edge-friendly language dropdown has contrast, keyboard access and a selected state",async()=>{
  const [css,site,react]=await Promise.all([
    load("public/brte-site.css"),load("public/brte-site.js"),load("src/App.tsx"),
  ]);
  assert.match(css,/html\[data-brte-theme="dark"\] \.brte-site-header \.brte-language-options/);
  assert.match(css,/background:#14243a/);
  assert.match(css,/color:#f5f8ff/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/button\[aria-current="true"\]/);
  assert.match(react,/<details className="brte-language-menu">/);
  assert.match(react,/<summary aria-label=\{tx\("language"\)\}>/);
  assert.match(react,/aria-current=\{i18n.language===code/);
  assert.match(site,/\.brte-language-options \[data-lang\]/);
  assert.match(site,/write\("aftercare-language",language\)/);
  assert.match(site,/BRTEContentI18n\?\.apply\(language\)/);
});

test("runtime language switching changes content and can restore Portuguese",async()=>{
  const data=await languageData();
  const nodes=[
    {key:"store.title",textContent:"Encontre um ponto de apoio presencial",getAttribute(k){return k==="data-brte-text"?this.key:null}},
    {key:"store.disclaimer",textContent:"texto de aviso em português",getAttribute(k){return k==="data-brte-text"?this.key:null}},
  ];
  const title="Pontos de apoio presencial em São Paulo | BRTE";
  const doc={
    title,documentElement:{lang:"pt-BR"},
    querySelectorAll(sel){return sel==="[data-brte-text]"?nodes:[]},
    querySelector(sel){return null}
  };
  const context={window:{BRTE_I18N_DATA:data},document:doc,location:{pathname:"/pontos-de-apoio/"}};
  vm.runInNewContext(await load("public/brte-content-i18n.js"),context);
  const apply=context.window.BRTEContentI18n.apply;
  apply("en");
  assert.equal(nodes[0].textContent,"Find an in-person support location");
  assert.equal(doc.documentElement.lang,"en");
  apply("zh-CN");
  assert.equal(nodes[0].textContent,"查找线下支持地点");
  assert.equal(doc.documentElement.lang,"zh-CN");
  assert.match(nodes[1].textContent,/BRTE/);
  apply("pt-BR");
  assert.equal(nodes[0].textContent,"Encontre um ponto de apoio presencial");
  assert.equal(nodes[1].textContent,"texto de aviso em português");
  assert.equal(doc.title,title);
});

test("legal pages must disclose Portuguese as their only legal source in other UI languages",async()=>{
 const [privacy,cookies,core]=await Promise.all([
   load("public/privacy/index.html"),load("public/cookies/index.html"),
   load("public/brte-content-i18n.js")
 ]);
 for(const html of [privacy,cookies]){
   assert.match(html,/class="brte-language-note"/);
   assert.match(html,/src="\/brte-content-i18n.js"/);
   assert.match(html,/name="robots" content="noindex,follow"/);
 }
 assert.match(core,/isLegal \? "pt-BR" : language/);
 assert.match(core,/This legal document is currently available in Portuguese/);
});
