import type { Case } from "./api";

/**
 * Exports only the explicitly selected, already authorized dashboard records.
 * UTF-8 BOM and a semicolon delimiter work well in Brazilian Excel.
 * All values are quoted and spreadsheet formulas are neutralized.
 */
const columnNames = [
  "Protocolo",
  "Recebido em",
  "Cliente",
  "E-mail",
  "Telefone",
  "País",
  "Estado",
  "Cidade",
  "Marca",
  "Modelo",
  "Versão do software",
  "Categoria",
  "Problema",
  "Descrição do problema",
  "Comportamento esperado",
  "Operadora",
  "Status",
  "Prioridade",
  "Responsável",
  "Organização do caso",
  "Caso principal (duplicado)",
];

const statuses: Record<string, string> = {
  received: "Recebido",
  reviewing: "Em análise",
  awaiting_customer: "Aguardando cliente",
  resolved: "Resolvido",
};
const priorities: Record<string, string> = {
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};
const moderation: Record<string, string> = {
  active: "Ativo",
  spam: "Spam",
  duplicate: "Duplicado",
  archived: "Arquivado",
};

function csvCell(value: unknown): string {
  let text = String(value ?? "").replace(/\u0000/g, "");
  // Untrusted case fields must never be executable in Excel/Sheets.
  if (/^(?:[\t\r\n]|[\s\uFEFF]*[=+\-@])/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function formatDate(value: string): string {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toLocaleString("pt-BR") : value || "";
}

export function makeCasesCsv(cases: readonly Case[]): string {
  const rows: unknown[][] = [
    columnNames,
    ...cases.map((c) => [
      c.id,
      formatDate(c.createdAt),
      c.name,
      c.email,
      c.phone,
      c.country,
      c.state,
      c.city,
      c.brand?.toUpperCase(),
      c.model,
      c.build,
      c.category === "software" ? "Sistema e aplicativos" : c.category === "hardware" ? "Hardware" : c.category,
      c.problem,
      c.description,
      c.expected,
      c.carrier,
      statuses[c.status] || c.status,
      priorities[c.priority] || c.priority,
      c.owner || "Não atribuído",
      moderation[c.moderationState || "active"] || c.moderationState,
      c.duplicateOfCaseId,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
