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
export async function upload(caseId: string, accessToken: string, file: File) {
  const e = await api(
    "/cases/" + caseId + "/evidence",
    post({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    }),
    accessToken,
  );
  const r = await fetch(e.url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      ...(e.url.startsWith("/")
        ? { Authorization: "Bearer " + e.uploadToken }
        : {}),
    },
    body: file,
  });
  if (!r.ok)
    throw Error("O envio de " + file.name + " falhou. Tente novamente.");
  await api("/evidence/" + e.id + "/complete", post({}), accessToken);
}
