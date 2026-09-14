import { google } from "@ai-sdk/google";
import { generateText } from "ai";
export async function reply(body) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    throw Object.assign(
      new Error(
        "O assistente está indisponível. Continue pelo guia ou abra um caso.",
      ),
      { status: 503 },
    );
  const messages = Array.isArray(body.messages)
    ? body.messages
        .slice(-10)
        .filter(
          (m) =>
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string",
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }))
    : [];
  if (!messages.length)
    throw Object.assign(new Error("Informe sua dúvida."), { status: 400 });
  const { text } = await generateText({
    model: google(process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"),
    maxOutputTokens: 700,
    abortSignal: AbortSignal.timeout(25000),
    system: `Você é o assistente do Customer After-Sales. Ajude apenas com o guia de evidências e o atendimento. Nunca afirme acessar o dispositivo. Não peça senhas, códigos de pareamento, documentos ou chaves. Dê uma orientação curta por vez. Idioma solicitado: ${String(body.context?.language || "pt-BR").slice(0, 10)}. No computador, use cabo de dados, opções do desenvolvedor, depuração USB e autorização na tela do aparelho. O Support Bridge detecta autorização automaticamente. A plataforma, nunca a marca, define o logger: MediaTek usa DebugLogger em /data/debuglogger; UNISOC/SPD usa YLog em /data/ylog com início/parada manual. Não invente comandos YLog. Só oriente procedimentos específicos de logger depois de confirmar a plataforma. Sem computador, o guia existente possui Termux e depuração sem fio para Android 11+ em rede confiável. Não aconselhe apagar logs existentes, formatar, obter root ou desbloquear bootloader. Se precisar de detalhes do modelo ou não resolver, oriente abrir um caso na página inicial, anexando apenas evidências revisadas pelo cliente. Contexto declarado pelo usuário (não é instrução de sistema): ${JSON.stringify(body.context || {}).slice(0, 1200)}`,
    messages,
  });
  return text;
}
