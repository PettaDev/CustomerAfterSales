/**
 * Read-only, privacy-safe retention planning. NEVER deletes data or objects.
 * Requires explicit BRTE_RETENTION_CASE_DAYS and BRTE_RETENTION_EVIDENCE_DAYS
 * to estimate candidates; no retention period is in force merely by running this script.
 */
if(!process.env.DATABASE_URL){
 console.error("Read-only report requires DATABASE_URL; no local/customer database opened.");
 process.exit(2);
}
const caseDays=Number(process.env.BRTE_RETENTION_CASE_DAYS);
const evidenceDays=Number(process.env.BRTE_RETENTION_EVIDENCE_DAYS);
const validDays=n=>Number.isInteger(n)&&n>=1&&n<=3650;
if(!validDays(caseDays)||!validDays(evidenceDays)){
 console.error("Set BRTE_RETENTION_CASE_DAYS and BRTE_RETENTION_EVIDENCE_DAYS to approved positive day counts.");
 process.exit(2);
}
const db=await import("../server/store.mjs");
const now=Date.now();
const cases=await db.list("case");
const evidence=await db.list("evidence");
const byId=new Map(cases.map(c=>[c.id,c]));
const validDate=v=>{const n=Date.parse(String(v||""));return Number.isFinite(n)?n:null};
const eligibleCases=cases.filter(c=>c.status==="resolved"&&
  (validDate(c.updatedAt)??validDate(c.createdAt))!=null &&
  now-(validDate(c.updatedAt)??validDate(c.createdAt))>caseDays*86400000);
const eligibleCaseIds=new Set(eligibleCases.map(c=>c.id));
const evidenceCandidates=evidence.filter(e=>{
 const c=byId.get(e.caseId);
 if(!c||c.status!=="resolved")return false;
 const closed=validDate(c.updatedAt)??validDate(c.createdAt);
 return closed!==null&&now-closed>evidenceDays*86400000;
});
const totals={mode:"DRY_RUN_ONLY",policyApproved:false,
  casesTotal:cases.length,evidenceTotal:evidence.length,
  proposedCaseCandidates:eligibleCases.length,
  proposedEvidenceCandidates:evidenceCandidates.length,
  proposedEvidenceBytes:evidenceCandidates.reduce((sum,e)=>sum+Number(e.size||0),0),
  note:"No DELETE, TRUNCATE, DROP or object-store operation was performed. Legal holds, backup retention, storage copies and individual rights must be reviewed before any purge."};
console.log(JSON.stringify(totals,null,2));
