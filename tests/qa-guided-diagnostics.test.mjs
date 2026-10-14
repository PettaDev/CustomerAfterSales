import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
const topics=["Conectividade","Aplicativos","Rede móvel","Bateria e temperatura","Sistema e atualização"];
const guides=["wifi-desconecta","aplicativo-fecha","rede-movel-sms","aquecimento-bateria","atualizacao-sistema"];

test("Q&A supports accessible category filters, search and result counts",async()=>{
 const [index,style]=await Promise.all([read("public/ajuda/index.html"),read("public/brte-help-improvements.css")]);
 for(const category of topics)assert.ok(index.includes('data-topic="'+category+'"'));
 assert.ok(index.includes('aria-pressed="true"'));
 assert.ok(index.includes('id="results-count"'));
 assert.ok(index.includes('aria-live="polite"'));
 assert.ok(index.includes('input.addEventListener("input",update)'));
 assert.ok(index.includes('category===topic'));
 assert.ok(index.includes('href="/brte-help-improvements.css"'));
 assert.ok(style.includes('.brte-topic-filters button:focus-visible'));
});

test("each guide provides four voluntary private checks and a route to case creation",async()=>{
 const [js,css]=await Promise.all([read("public/brte-guide-checklist.js"),read("public/brte-help-improvements.css")]);
 assert.ok(js.includes("steps.filter(x=>x.checked).length"));
 assert.ok(!js.includes("fetch("));
 assert.ok(!js.includes("localStorage"));
 assert.ok(!js.includes("sendBeacon"));
 assert.ok(css.includes('.brte-checklist li'));
 for(const slug of guides){
  const s=await read("public/ajuda/"+slug+"/index.html");
  assert.equal((s.match(/data-check-step="/g)||[]).length,4);
  assert.ok(s.includes('src="/brte-guide-checklist.js"'));
  assert.ok(s.includes('href="/brte-help-improvements.css"'));
  assert.ok(s.includes("não são enviadas ao BRTE"));
  assert.ok(s.includes('href="/?category=software&amp;problem='));
 }
});
