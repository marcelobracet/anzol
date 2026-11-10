"use client";

import type { OfferTimerStep } from "@/features/steps/offer-timer/schema";
import { TextField } from "../components/fields";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";
import { OfferSelect } from "./offer-select";

export function OfferTimerForm({ step, onChange, issues, offers }: StepFormProps<OfferTimerStep>) {
  const set = (patch: Partial<OfferTimerStep>) => onChange({ ...step, ...patch });
  const offer = offers.find((o) => o.id === step.offerId);
  return (
    <div className="grid gap-4">
      <OfferSelect offers={offers} value={step.offerId} onChange={(offerId) => set({ offerId })} />
      {!offer?.promo && <p className="text-xs text-amber-700 dark:text-amber-400">A contagem usa o prazo real da promoção. Ative o preço promocional na oferta.</p>}
      <TextField label="Título" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <TextField label="Texto quando expirar" value={step.expiredText} onChange={(expiredText) => set({ expiredText })} error={errorAt(issues, "expiredText")} />
      <TextField label="Texto do botão" hint="Avança para o próximo step; se o timer for o último, abre o checkout." value={step.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} error={errorAt(issues, "ctaLabel")} />
    </div>
  );
}
