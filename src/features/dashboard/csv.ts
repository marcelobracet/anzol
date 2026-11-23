import type { Step } from "@/features/steps/schema";
import { answerLabels } from "./engagement";
import type { ResponseRow } from "./responses-types";

// Excel/Sheets executam célula que começa com = + - @: prefixa com aspa simples (CSV injection).
function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Uma linha por pessoa, uma coluna por pergunta (na ordem do quiz). */
export function responsesCsv(steps: Step[], rows: ResponseRow[]): string {
  const questions = steps.filter((s) => s.type === "question");
  const header = ["data", "nome", "email", "telefone", "utm_source", "utm_campaign", "utm_content", "etapas_vistas", ...questions.map((q) => (q.type === "question" ? q.title : ""))];
  const lines = rows.map((r) => {
    const labels = new Map(answerLabels(steps, r.answers).map((a) => [a.stepId, a.labels.join(" | ")]));
    return [
      r.lastAt ?? "",
      r.lead?.name,
      r.lead?.email,
      r.lead?.phone,
      r.utm.utm_source,
      r.utm.utm_campaign,
      r.utm.utm_content,
      r.stepsViewed,
      ...questions.map((q) => labels.get(q.id) ?? ""),
    ].map(cell).join(",");
  });
  // BOM: o Excel abre acentos e ñ corretamente.
  return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
}
