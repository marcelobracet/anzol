import type { QuizDocument } from "./schema";

export type PublishIssue = { code: string; stepId?: string; message: string };

// Steps que encerram o quiz: resultado, VSL ou timer (cujo botão leva ao checkout).
const FINAL_STEP_TYPES = new Set(["result", "vsl", "offerTimer"]);

// Regras de negócio que só valem na publicação. O rascunho pode estar incompleto.
export function validateForPublish(doc: QuizDocument, now: Date = new Date()): PublishIssue[] {
  const visible = doc.steps.filter((s) => !s.hidden);
  if (visible.length === 0) {
    return [{ code: "no-visible-steps", message: "O quiz precisa de ao menos um step visível" }];
  }

  const offers = new Map(doc.offers.map((o) => [o.id, o]));
  const issues: PublishIssue[] = [];

  for (const step of visible) {
    if (step.type === "socialProof") {
      for (const item of step.items.filter((i) => !i.consentConfirmed)) {
        issues.push({
          code: "social-proof-consent",
          stepId: step.id,
          message: `Depoimento ${item.id} sem consentimento confirmado`,
        });
      }
    }
    if (step.type === "offerTimer") {
      const promo = offers.get(step.offerId)?.promo;
      if (!promo) {
        issues.push({
          code: "offer-timer-without-expiry",
          stepId: step.id,
          message: "O timer precisa de uma oferta com promoção e data de expiração",
        });
      } else if (new Date(promo.expiresAt) <= now) {
        issues.push({
          code: "offer-timer-expired",
          stepId: step.id,
          message: "A promoção ligada ao timer já expirou",
        });
      }
    }
  }

  if (doc.settings.mode === "vsl") {
    if (!visible.some((s) => s.type === "vsl")) {
      issues.push({ code: "vsl-mode-without-vsl", message: "No modo só VSL, o quiz precisa de um step VSL visível" });
    }
    return issues;
  }

  const last = visible[visible.length - 1];
  if (!FINAL_STEP_TYPES.has(last.type)) {
    issues.push({
      code: "invalid-final-step",
      stepId: last.id,
      message: "O último step visível precisa ser Resultado, VSL ou Oferta com prazo",
    });
  }
  return issues;
}
