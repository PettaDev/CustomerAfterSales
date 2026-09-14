export async function api<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const r = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...options.headers,
    },
  });
  const b = await r.json();
  if (!r.ok) throw Error(b.error || "Não foi possível concluir.");
  return b;
}
export const post = (body: unknown) => ({
  method: "POST",
  body: JSON.stringify(body),
});
export const statusName: Record<string, string> = {
  received: "Recebido",
  reviewing: "Em análise",
  awaiting_customer: "Aguardando você",
  resolved: "Resolvido",
  recording: "Gravando",
  complete: "Concluída",
  partial: "Evidência parcial",
  failed: "Falha na coleta",
  interrupted: "Captura interrompida",
  awaiting_ylog_stop: "Aguardando parada dos logs",
  finalizing: "Finalizando",
};
export type Case = {
  id: string;
  brand: string;
  model: string;
  build: string;
  category: string;
  problem: string;
  description: string;
  expected: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  postalCode?: string;
  street?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  carrier: string;
  status: string;
  priority: string;
  owner?: string;
  createdAt: string;
};

function evidenceType(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".log") || name.endsWith(".prop") || name.endsWith(".xml") || name.endsWith(".csv")) {
    return "text/plain";
  }
  if (name.endsWith(".zip")) return "application/zip";
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return file.type || "application/octet-stream";
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function upload(caseId: string, accessToken: string, file: File) {
  const type = evidenceType(file);
  const e = await api(
    "/cases/" + caseId + "/evidence",
    post({
      name: file.name,
      type,
      size: file.size,
    }),
    accessToken,
  );

  let lastDetail = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const r = await fetch(e.url, {
        method: "PUT",
        headers: {
          "Content-Type": type,
          ...(e.url.startsWith("/")
            ? { Authorization: "Bearer " + e.uploadToken }
            : {}),
        },
        body: file,
      });
      if (r.ok) {
        await api("/evidence/" + e.id + "/complete", post({}), accessToken);
        return;
      }
      const body = (await r.text().catch(() => "")).slice(0, 240);
      lastDetail = `HTTP ${r.status}${body ? `: ${body}` : ""}`;
      if (r.status < 500 && r.status !== 429) break;
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : String(error);
    }
    await wait(700 * (attempt + 1));
  }

  throw Error(
    `O envio de ${file.name} falhou.${lastDetail ? ` (${lastDetail})` : ""} Tente novamente.`,
  );
}
