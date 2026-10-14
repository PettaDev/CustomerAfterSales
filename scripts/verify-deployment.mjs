/** Non-destructive BRTE release smoke check.
 * Run with BRTE_BASE_URL=https://preview.example.com node scripts/verify-deployment.mjs
 * Optional BRTE_VERCEL_BYPASS is read from the environment but never printed.
 */
const base=process.env.BRTE_BASE_URL?.trim();
if(!base){console.error("Set BRTE_BASE_URL to a deployment URL.");process.exit(2);}
let origin;
try{
 const url=new URL(base);
 if(url.protocol!=="https:" && !(url.protocol==="http:" && ["127.0.0.1","localhost"].includes(url.hostname)))
   throw new Error("HTTPS required");
 origin=url.origin;
}catch{console.error("Invalid BRTE_BASE_URL. Use HTTPS or local loopback.");process.exit(2);}
const bypass=process.env.BRTE_VERCEL_BYPASS;
const headers=bypass && new URL(origin).hostname.endsWith(".vercel.app")
 ? {"x-vercel-protection-bypass":bypass} : {};
const checks=[
 {name:"homepage",url:"/",html:true},
 {name:"help center",url:"/ajuda/",html:true},
 {name:"support locations",url:"/pontos-de-apoio/",html:true},
 {name:"privacy",url:"/privacy/",html:true},
 {name:"cookies",url:"/cookies/",html:true},
 {name:"readiness",url:"/api/health",json:true},
];
let failures=0;
for(const check of checks){
 try{
  const response=await fetch(origin+check.url,{method:"GET",headers,
    signal:AbortSignal.timeout(12000),redirect:"manual"});
  const type=response.headers.get("content-type")||"";
  if(response.status===401||response.status===403){
    console.log(check.name+": PROTECTED ("+response.status+"), cannot verify without authorized access");
    failures++;continue;
  }
  if(!response.ok){console.log(check.name+": FAILED HTTP "+response.status);failures++;continue;}
  if(check.html){
    const body=await response.text();
    if(!type.includes("text/html")||!body.includes("BRTE")){
      console.log(check.name+": FAILED invalid page content");failures++;continue;
    }
    console.log(check.name+": OK");
  }else{
    if(!type.includes("application/json")){console.log(check.name+": FAILED non-JSON");failures++;continue;}
    const body=await response.json();
    if(body.ok!==true||body.database!=="ready"||body.storage!=="configured"||body.teamAuthReady!==true){
      console.log("readiness: NOT READY (DB="+String(body.database)+", storage="+String(body.storage)+", staff="+Boolean(body.teamAuthReady)+")");
      failures++;continue;
    }
    console.log("readiness: OK");
  }
 }catch{
  console.log(check.name+": FAILED request/timeout");failures++;
 }
}
console.log("BRTE read-only smoke check: "+(checks.length-failures)+"/"+checks.length+" passed");
if(failures)process.exitCode=1;
