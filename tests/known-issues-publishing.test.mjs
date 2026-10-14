import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("unapproved Jira or customer issues never become crawlable pages",async()=>{
 const [dataText,code,help,vercel,packageText]=await Promise.all([
  load("content/approved-known-issues.json"),
  load("scripts/generate-known-issues.mjs"),
  load("public/ajuda/index.html"),
  load("vercel.json"),
  load("package.json"),
 ]);
 const data=JSON.parse(dataText);
 assert.equal(data.version,1);
 assert.ok(Array.isArray(data.issues));
 assert.equal(data.issues.length,0,"No issues have been signed off for publication yet");
 assert.match(code,/publicationApproved!==true \|\| entry\.privacyReviewed!==true/);
 assert.match(code,/approvedBy===entry\.privacyReviewedBy/);
 assert.match(code,/denyPrivate/);
 assert.match(code,/meta name="robots"/);
 assert.match(code,/TechArticle/);
 assert.match(code,/sitemap\.xml/);
 assert.match(code,/BRTE_KNOWN_ISSUES_START/);
 assert.match(help,/href="\/ajuda\/problemas-conhecidos\/"/);
 assert.match(help,/help\.knownTitle/);
 const pkg=JSON.parse(packageText);
 assert.match(pkg.scripts.build,/generate-known-issues\.mjs/);
 assert.ok(JSON.parse(vercel).rewrites.some(r=>r.source==="/ajuda/problemas-conhecidos/:issue/"));
});
test("known issue documents declare original Portuguese and four-language notice availability",async()=>{
 const a=await load("public/brte-known-issues.js");
 assert.match(a,/language==="pt-BR"/);
 assert.match(a,/es-419/);
 assert.match(a,/zh-CN/);
 assert.match(a,/brte:language-changed/);
});
