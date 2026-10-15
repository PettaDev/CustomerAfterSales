// Customer case confirmation is distinct from staff OTP. Text-only messages
// minimize HTML injection risk; the private case credential never enters URLs,
// logs, analytics, database plaintext or third-party tracking links.
const COPY = {
  "pt-BR": {
    subject: "BRTE — confirmação do seu atendimento",
    intro: "Seu atendimento foi registrado no BRTE.",
    protocol: "Protocolo",
    code: "Código privado de acompanhamento",
    track: "Para acompanhar seu caso, abra esta página e digite os dois dados acima:",
    caution: "Guarde esses dados com segurança. Qualquer pessoa com ambos poderá consultar seu caso. Não encaminhe este e-mail.",
    delivery: "A equipe poderá entrar em contato caso precise de informações adicionais.",
    ignore: "Se você não abriu este atendimento, não utilize os dados e entre em contato pelos canais oficiais.",
  },
  en: {
    subject: "BRTE — your case confirmation",
    intro: "Your BRTE support case has been registered.",
    protocol: "Case number",
    code: "Private case access code",
    track: "To track your case, open this page and enter the two details above:",
    caution: "Keep both details secure. Anyone with them can access your case. Do not forward this email.",
    delivery: "The team may contact you if more information is required.",
    ignore: "If you did not open this case, do not use these credentials; contact support through official channels.",
  },
  "es-419": {
    subject: "BRTE — confirmación de tu caso",
    intro: "Tu caso de soporte BRTE se registró correctamente.",
    protocol: "Número de caso",
    code: "Código privado de seguimiento",
    track: "Para consultar tu caso, abre esta página e introduce los dos datos anteriores:",
    caution: "Guarda ambos datos de forma segura. Cualquier persona con ellos podrá acceder a tu caso. No reenvíes este correo.",
    delivery: "El equipo podrá contactarte si necesita más información.",
    ignore: "Si no abriste este caso, no utilices los datos y comunícate con soporte por los canales oficiales.",
  },
  "zh-CN": {
    subject: "BRTE — 服务单确认",
    intro: "您的 BRTE 支持服务单已创建。",
    protocol: "服务单号",
    code: "私密查询访问码",
    track: "请打开以下页面并输入上述两项信息，以查询您的服务单：",
    caution: "请妥善保存这两项信息。任何同时拥有它们的人都可以查看服务单。请勿转发此邮件。",
    delivery: "如需补充信息，支持团队可能会与您联系。",
    ignore: "若您没有提交此服务单，请不要使用这些信息，并通过官方渠道联系支持。",
  },
};

function localized(language) {
  const value = String(language || "").toLowerCase();
  if (value.startsWith("pt")) return COPY["pt-BR"];
  if (value.startsWith("es")) return COPY["es-419"];
  if (value.startsWith("zh")) return COPY["zh-CN"];
  return COPY.en;
}

const trackingUrl = () => {
  const raw = String(process.env.CASE_TRACKING_URL || "https://brteportal.com.br/tracking").trim();
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash)
      return null;
    return parsed.toString();
  } catch { return null; }
};

export function caseConfirmationConfigured() {
  // Feature flag is intentionally OFF by default until production DNS/Resend
  // sender, deliverability and consent have been verified by the operator.
  return process.env.CASE_EMAIL_ENABLED === "true" &&
    Boolean(process.env.RESEND_API_KEY && process.env.CASE_EMAIL_FROM && trackingUrl());
}

export function buildCaseConfirmationText({ protocol, accessToken, language, url }) {
  const copy = localized(language);
  return [
    "BRTE · TRANSSION", "",
    copy.intro, "",
    copy.protocol + ": " + protocol,
    copy.code + ": " + accessToken, "",
    copy.track, url, "",
    copy.caution, "", copy.delivery, copy.ignore,
  ].join("\n");
}

export async function sendCaseConfirmation({ to, protocol, accessToken, language }) {
  if (!caseConfirmationConfigured()) return "disabled";
  const url = trackingUrl();
  const copy = localized(language);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
      // Resend de-duplicates repeat submissions with the same case ID.
      "Idempotency-Key": "brte-case-confirmation-" + protocol,
    },
    body: JSON.stringify({
      from: process.env.CASE_EMAIL_FROM,
      to: [to],
      subject: copy.subject,
      text: buildCaseConfirmationText({ protocol, accessToken, language, url }),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    // Do not record private tokens, recipient address or provider response body.
    console.error("[BRTE] Case confirmation provider rejected request", {
      provider: "resend", status: response.status,
    });
    return "failed";
  }
  const accepted = await response.json().catch(() => ({}));
  const messageId = typeof accepted?.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(accepted.id)
    ? accepted.id : null;
  console.info("[BRTE] Case confirmation accepted by email provider", {
    provider: "resend", status: response.status, messageId,
  });
  // Provider acceptance is not proof of inbox delivery.
  return "accepted";
}

export async function notifyCaseCreated(details) {
  if (!caseConfirmationConfigured()) return "disabled";
  try {
    return await sendCaseConfirmation(details);
  } catch {
    console.error("[BRTE] Case confirmation request failed", { provider: "resend" });
    return "failed";
  }
}
