import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sendStaffAccessCode } from "../server/email.mjs";

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255);
  const [r, g, b] = rgb.map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a, b) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function cssDeclaration(css, selector, prop) {
  const rule = new RegExp(escapeRegExp(selector) + "\\s*\\{([^}]+)\\}");
  const block = css.match(rule)?.[1];
  assert.ok(block, "missing expected CSS selector: " + selector);
  const declaration = block.match(new RegExp("(^|;)\\s*" + escapeRegExp(prop) + ":\\s*(#[0-9a-fA-F]{6})\\b"));
  assert.ok(declaration, "missing color: " + selector + " " + prop);
  return declaration[2].toLowerCase();
}

test("light and dark UI color pairs meet WCAG AA normal-text contrast", async () => {
  const css = await readFile(new URL("../public/brte-site.css", import.meta.url), "utf8");
  // Actual CSS declarations, not duplicated expected colors.
  const checks = [
    [".portal[data-theme=\"light\"]", "--muted", "#ffffff"],
    [".portal[data-theme=\"light\"] .text-action", "color", "#ffffff"],
    [".portal[data-theme=\"light\"] .status.received", "color", "#fff5de"],
    [".portal[data-theme=\"light\"] .status.resolved", "color", "#e7f8ef"],
    [".portal[data-theme=\"light\"] .status.failed", "color", "#fff0f3"],
    [".portal[data-theme=\"light\"] th", "color", "#edf3fa"],
    [".portal[data-theme=\"dark\"] .error", "color", "#42232c"],
  ];
  for (const [selector, property, background] of checks) {
    assert.ok(
      contrast(cssDeclaration(css, selector, property), background) >= 4.5,
      "low-contrast declaration: " + selector + " " + property,
    );
  }
  for (const selector of [
    ".portal[data-theme=\"light\"] .filters button",
    ".portal[data-theme=\"light\"] .filters button.active",
    ".portal[data-theme=\"light\"] .consent",
    ".portal[data-theme=\"light\"] .guide-link",
    ".portal[data-theme=\"light\"] .empty",
    ".portal[data-theme=\"light\"] .count",
    ".portal[data-theme=\"light\"] button:disabled",
  ]) assert.ok(css.includes(selector), "missing site-wide accessible style: " + selector);
});

test("staff login is honest about mailbox delivery, localized and rate-limited", async () => {
  const [ui, cases] = await Promise.all([
    readFile(new URL("../src/portal/portal-ui-i18n.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/portal/Cases.tsx", import.meta.url), "utf8"),
  ]);
  for (const message of ["Verifique seu e-mail", "Check your email", "Revisa tu correo", "请检查邮箱"]) {
    assert.ok(ui.includes(message), "missing delivery-status copy: " + message);
  }
  assert.ok(ui.includes("Lixo Eletrônico"));
  assert.match(cases, /<Mail size=\{20\} aria-hidden="true"\/>/);
  assert.match(cases, /disabled=\{busy \|\| retryAfterSeconds > 0\}/);
  assert.match(cases, /setRetryAfterSeconds/);
});

test("Resend acceptance is traceable but never represented as guaranteed inbox delivery", async () => {
  const oldFetch = globalThis.fetch;
  const oldInfo = console.info;
  const oldKeys = Object.fromEntries(
    ["NODE_ENV", "AUTH_EMAIL_PROVIDER", "RESEND_API_KEY", "AUTH_EMAIL_FROM"]
      .map((key) => [key, process.env[key]])
  );
  const logs = [];
  let sent = false;
  try {
    process.env.RESEND_API_KEY = "re_local_test_just_for_unit_tests";
    process.env.AUTH_EMAIL_FROM = "BRTE <acesso@mail.example.com>";
    delete process.env.AUTH_EMAIL_PROVIDER;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.resend.com/emails");
      const data = JSON.parse(options.body);
      assert.equal(data.to[0], "person@example.com");
      assert.equal(data.subject, "Seu código de acesso ao BRTE");
      assert.ok(data.text.includes("867530"));
      assert.ok(options.headers.Authorization.startsWith("Bearer "));
      sent = true;
      return {
        ok: true, status: 200, json: async () => ({ id: "email_diagnostic-id-123" }),
      };
    };
    console.info = (...args) => logs.push(args);
    const result = await sendStaffAccessCode({
      to: "person@example.com", code: "867530", language: "pt-BR",
    });
    assert.equal(result.delivered, true); // legacy return value: provider accepted.
    assert.ok(sent);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][1].messageId, "email_diagnostic-id-123");
    const serialized = JSON.stringify(logs);
    for (const secret of ["867530", "person@example.com", process.env.RESEND_API_KEY]) {
      assert.equal(serialized.includes(secret), false, "sensitive information in logs");
    }
  } finally {
    globalThis.fetch = oldFetch;
    console.info = oldInfo;
    for (const [key, value] of Object.entries(oldKeys)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
