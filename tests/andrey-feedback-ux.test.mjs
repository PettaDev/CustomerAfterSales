import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { findNewCases } from "../src/portal/new-case-monitor.ts";
import { workspaceCopy } from "../src/portal/workspace-copy.ts";

const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("incoming cases are real: first poll is baseline, only recent new received cases alert", () => {
  const now = Date.parse("2026-10-16T02:00:00Z");
  const make = (id, minutesAgo, status="received", moderationState="active") => ({
    id, status, moderationState, createdAt:new Date(now-minutesAgo*60_000).toISOString(),
  });
  const existing = make("CAS-original",5);
  const baseline = findNewCases(null,[existing],now);
  assert.deepEqual(baseline.fresh,[]);
  assert.deepEqual([...baseline.known],["CAS-original"]);
  const fresh = make("CAS-new",1);
  const old = make("CAS-old",600);
  const spam = make("CAS-spam",1,"received","spam");
  const resolved = make("CAS-resolved",1,"resolved");
  const next = findNewCases(baseline.known,[existing,fresh,old,spam,resolved],now);
  assert.deepEqual(next.fresh.map(x=>x.id),["CAS-new"]);
  assert.deepEqual(findNewCases(next.known,[existing,fresh],now).fresh,[]);
});

test("authenticated TFAE live polling never fabricates alert or changes server-side authorization", async () => {
  const [cases, api, css] = await Promise.all([
    read("src/portal/Cases.tsx"),
    read("src/portal/api.ts"),
    read("src/portal/workspace-refresh.css"),
  ]);
  assert.match(cases,/api\("\/cases\?limit=100&scope=all&moderation=active&status=received"\)/);
  assert.match(cases,/if \(!auth \|\| staffUser\?\.role !== "tfae"\) return/);
  assert.match(cases,/window\.setInterval\(\(\) => void check\(\), 45_000\)/);
  assert.match(cases,/document\.visibilityState === "hidden"/);
  assert.match(cases,/findNewCases\(seenIncoming\.current, pending\)/);
  assert.match(cases,/aria-live="polite"/);
  assert.match(cases,/setIncomingCases\(\[\]\)/);
  assert.match(cases,/openCase\(c\.id\)/);
  assert.match(css,/brte-unread-row/);
  assert.match(css,/brte-new-case-alert/);
  assert.match(api,/export type Case/);
});

test("OTP retains 6-digit input, trust-device and API wiring with accessible hierarchy", async () => {
  const [cases,css] = await Promise.all([read("src/portal/Cases.tsx"),read("src/portal/workspace-refresh.css")]);
  for (const text of ["brte-auth-otp","brte-auth-code-intro","brte-otp-field","brte-auth-trust","brte-auth-links","brte-auth-submit"]) {
    assert.ok(cases.includes(text), "missing auth element " + text);
    assert.ok(css.includes(text), "missing CSS auth element " + text);
  }
  assert.match(cases,/api\("\/auth\/verify-code"/);
  assert.match(cases,/api\("\/auth\/request-code"/);
  assert.match(cases,/pattern="\[0-9\]\{6\}"/);
  assert.match(cases,/autoComplete="one-time-code"/);
  assert.match(cases,/retryAfterSeconds > 0/);
  assert.match(cases,/trustDevice/);
});

test("workspace is responsive, role-aware and all mobile case fields are labeled", async () => {
  const [cases,css,theme] = await Promise.all([
    read("src/portal/Cases.tsx"),read("src/portal/workspace-refresh.css"),
    read("public/brte-site.css"),
  ]);
  assert.match(cases,/role === "manager" \? \[\] : \[\["mine"/);
  assert.match(cases,/brte-team-grid/);
  assert.match(cases,/brte-cases-table/);
  for (const label of ["ui.caseProblem","ui.device","ui.status","ui.owner","ui.priority","ui.received"]) {
    assert.ok(cases.includes("data-label={" + label + "}"), "missing responsive label "+label);
  }
  for (const bp of ["max-width: 1180px","max-width: 850px","max-width: 540px"]) assert.ok(css.includes(bp));
  assert.match(theme,/higher-contrast BRTE palette/);
  assert.match(theme,/grid-template-columns: minmax\(170px,210px\) minmax\(0,1fr\)/);
});

test("new workspace text is translated across four languages", () => {
  for(const language of ["pt-BR","en","es-419","zh-CN"]){
    const t=workspaceCopy(language);
    for(const key of ["otpTitle","otpMailTip","newlyArrived","viewNew","dismiss","monitorHint","needsOwner"]) {
      assert.ok(t[key]?.length>=2,language+": "+key);
    }
  }
});
