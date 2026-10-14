import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import app from "../server/app-enhanced.mjs";

const root=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
const cwd=process.cwd();
const dir=await mkdtemp(tmpdir()+"/brte-hardening-p1-");
process.chdir(dir);
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
after(async()=>{process.chdir(cwd);await rm(dir,{recursive:true,force:true});});

test("rate limiter is atomic in its API, consumes quotas and applies cooldown", async()=>{
  const db=await import("../server/store.mjs");
  {
    const key="test-rate-7a8b9c0d";
    const batch=await Promise.all(Array.from({length:12},()=>db.consumeRate(key,{max:5,windowMs:60000})));
    assert.equal(batch.filter(x=>x.allowed).length,5);
    assert.equal(batch.filter(x=>!x.allowed).length,7);
    const coolKey="test-cooldown-00001";
    const first=await db.consumeRate(coolKey,{max:20,windowMs:60000,cooldownMs:10000});
    const second=await db.consumeRate(coolKey,{max:20,windowMs:60000,cooldownMs:10000});
    assert.equal(first.allowed,true);
    assert.equal(second.allowed,false);
  }
});

test("helpfulness ratings require known articles, contain no contacts and expose no public metrics", async()=>{
  const server=app.listen(0,"127.0.0.1");
  await new Promise(r=>server.once("listening",r));
  const base="http://127.0.0.1:"+server.address().port;
  try {
    const invalid=await fetch(base+"/api/help-feedback",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({slug:"internal-jira",helpful:true})});
    assert.equal(invalid.status,400);
    const sample={slug:"wifi-desconecta",helpful:false,language:"pt-BR"};
    const first=await fetch(base+"/api/help-feedback",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(sample)});
    assert.equal(first.status,202);
    assert.equal((await first.json()).ok,true);
    const repeat=await fetch(base+"/api/help-feedback",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(sample)});
    assert.equal(repeat.status,429);
    const publicStats=await fetch(base+"/api/auth/help-metrics");
    assert.equal(publicStats.status,401);
    const db=await import("../server/store.mjs");
    const stats=await db.helpFeedbackStats();
    assert.deepEqual(stats,[{slug:"wifi-desconecta",total:1,helpful:0}]);
    const votes=await db.list("help_feedback");
    assert.deepEqual(Object.keys(votes[0]).sort(),["at","helpful","language","slug"]);
    assert.ok(!JSON.stringify(votes).includes("127.0.0.1"));
  } finally {await new Promise(r=>server.close(r));}
});

test("all guides offer help voting and escalation without blocking SEO",async()=>{
 const help=await root("public/ajuda/index.html");
 const store=await root("public/pontos-de-apoio/index.html");
 assert.match(help,/brte-help-center\.js/);
 assert.match(help,/brte-help-center\.css/);
 assert.match(store,/brte-stores\.js/);
 assert.match(store,/brte-stores\.css/);
 for(const slug of ["wifi-desconecta","aplicativo-fecha","rede-movel-sms","aquecimento-bateria","atualizacao-sistema"]){
   const html=await root("public/ajuda/"+slug+"/index.html");
   assert.match(html,/class="brte-guide-feedback"/);
   assert.match(html,new RegExp('data-article="'+slug+'"'));
   assert.match(html,/data-helpful="true"/);
   assert.match(html,/data-helpful="false"/);
   assert.match(html,/href="\/\?category=software&amp;problem=/);
 }
 const helper=await root("public/brte-stores.js");
 assert.match(helper,/cleanStore/);
 assert.match(helper,/locationId/);
 assert.match(helper,/node.hidden=!match/);
});

test("TFAE quality insights aggregate only technical metadata and require staff authentication",async()=>{
 const db=await import("../server/store.mjs");
 const now=new Date().toISOString();
 await db.put("case","quality-case-a",{kind:"case",id:"quality-case-a",
   brand:"infinix",model:"X6873",category:"software",carrier:"VIVO",status:"reviewing",createdAt:now,
   name:"Synthetic Tester",email:"private.synthetic@example.invalid"});
 await db.put("case","quality-case-b",{kind:"case",id:"quality-case-b",
   brand:"tecno",model:"X6873",category:"software",carrier:"CLARO",status:"resolved",createdAt:now,
   name:"Synthetic Tester 2",email:"private2.synthetic@example.invalid"});
 const insights=await db.qualityInsights();
 assert.equal(insights.total,2);
 assert.equal(insights.recent,2);
 assert.equal(insights.unresolved,1);
 assert.deepEqual(insights.models,[{name:"X6873",total:2}]);
 assert.ok(insights.carriers.some(x=>x.name==="VIVO"));
 assert.ok(!JSON.stringify(insights).includes("private.synthetic"));
 const server=app.listen(0,"127.0.0.1");
 await new Promise(r=>server.once("listening",r));
 try {
  const response=await fetch("http://127.0.0.1:"+server.address().port+"/api/auth/quality-insights");
  assert.equal(response.status,401);
  assert.match(response.headers.get("x-request-id")||"",/^[0-9a-f-]{36}$/);
 } finally {await new Promise(r=>server.close(r));}
});
