const COPY = {
  "pt-BR": {
    subject: "Seu código de acesso ao BRTE",
    title: "Código de acesso",
    intro: "Use este código para acessar a área interna do BRTE:",
    expires: "O código expira em 10 minutos e só pode ser usado uma vez.",
    ignore: "Se você não solicitou este acesso, ignore este e-mail.",
  },
  en: {
    subject: "Your BRTE access code",
    title: "Access code",
    intro: "Use this code to access the internal BRTE workspace:",
    expires: "The code expires in 10 minutes and can only be used once.",
    ignore: "If you did not request this access, ignore this email.",
  },
  "es-419": {
    subject: "Tu código de acceso a BRTE",
    title: "Código de acceso",
    intro: "Usa este código para acceder al área interna de BRTE:",
    expires: "El código vence en 10 minutos y solo puede usarse una vez.",
    ignore: "Si no solicitaste este acceso, ignora este correo.",
  },
  "zh-CN": {
    subject: "您的 BRTE 访问验证码",
    title: "访问验证码",
    intro: "请使用此验证码进入 BRTE 内部工作区：",
    expires: "验证码将在 10 分钟后过期，并且只能使用一次。",
    ignore: "如果不是您本人请求访问，请忽略此邮件。",
  },
};

function languageCopy(language) {
  const key = String(language || "").toLowerCase();
  if (key.startsWith("pt")) return COPY["pt-BR"];
  if (key.startsWith("es")) return COPY["es-419"];
  if (key.startsWith("zh")) return COPY["zh-CN"];
  return COPY.en;
}

export function accessCodeEmailConfigured() {
  if (process.env.AUTH_EMAIL_PROVIDER === "test" && process.env.NODE_ENV === "test") return true;
  return !!(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

export async function sendStaffAccessCode({ to, code, language }) {
  const copy = languageCopy(language);

  if (process.env.AUTH_EMAIL_PROVIDER === "test" && process.env.NODE_ENV === "test") {
    return { delivered: true, debugCode: code };
  }

  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM) {
    throw Object.assign(new Error("Envio de código por e-mail não configurado."), { status: 503 });
  }

  const text = [
    copy.title,
    "",
    copy.intro,
    "",
    code,
    "",
    copy.expires,
    copy.ignore,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM,
      to: [to],
      subject: copy.subject,
      text,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw Object.assign(new Error("Não foi possível enviar o código agora."), { status: 502 });
  }

  return { delivered: true };
}
