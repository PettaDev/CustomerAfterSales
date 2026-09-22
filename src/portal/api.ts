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
  warrantyStatus?: "yes" | "no" | "unsure";
  deviceIdentifier?: string;
  purchaseDate?: string;
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

export class UploadError extends Error {
  fileName: string;
  detail: string;
  constructor(fileName: string, detail = "") {
    super("UPLOAD_FAILED");
    this.name = "UploadError";
    this.fileName = fileName;
    this.detail = detail;
  }
}

function putFile(
  url: string,
  token: string,
  type: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", type);
    if (url.startsWith("/")) request.setRequestHeader("Authorization", "Bearer " + token);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    request.onload = () => resolve({ status: request.status, body: (request.responseText || "").slice(0, 240) });
    request.onerror = () => reject(new Error("NETWORK_ERROR"));
    request.onabort = () => reject(new Error("UPLOAD_ABORTED"));
    request.send(file);
  });
}

export async function upload(
  caseId: string,
  accessToken: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
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
      onProgress?.(0);
      const result = await putFile(e.url, e.uploadToken, type, file, onProgress);
      if (result.status >= 200 && result.status < 300) {
        onProgress?.(100);
        await api("/evidence/" + e.id + "/complete", post({}), accessToken);
        return;
      }
      lastDetail = `HTTP ${result.status}${result.body ? `: ${result.body}` : ""}`;
      if (result.status < 500 && result.status !== 429) break;
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : String(error);
    }
    await wait(700 * (attempt + 1));
  }

  throw new UploadError(file.name, lastDetail);
}
