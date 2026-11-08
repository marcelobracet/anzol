"use client";

import type { VslStep } from "@/features/steps/vsl/schema";
import { DurationField } from "../components/duration-field";
import { CheckboxField, NumberField, SelectField, TextField } from "../components/fields";
import { VideoField } from "../components/video-field";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";
import { OfferSelect } from "./offer-select";

const ASPECTS = [
  { value: "9:16", label: "Em pé (9:16), ideal para celular" },
  { value: "16:9", label: "Deitado (16:9)" },
] as const;

export function VslForm({ step, onChange, issues, offers, quizId }: StepFormProps<VslStep>) {
  const set = (patch: Partial<VslStep>) => onChange({ ...step, ...patch });
  const { cta, toast, progressBar } = step;
  return (
    <div className="grid gap-4">
      <h3 className="text-sm font-semibold">Textos da página</h3>
      <TextField label="Faixa no topo (opcional)" value={step.banner} onChange={(v) => set({ banner: v || undefined })} />
      <TextField label="Headline (opcional)" value={step.headline} multiline onChange={(v) => set({ headline: v || undefined })} />
      <TextField label="Descrição abaixo da headline (opcional)" value={step.subheadline} onChange={(v) => set({ subheadline: v || undefined })} />
      <h3 className="text-sm font-semibold">Vídeo</h3>
      <SelectField label="Formato" value={step.aspect} options={ASPECTS} onChange={(aspect) => set({ aspect })} />
      <VideoField value={step.video} quizId={quizId} onChange={(video) => set({ video })} error={errorAt(issues, "video")} />
      <CheckboxField label="Barra de progresso acelerada" checked={progressBar.enabled} onChange={(enabled) => set({ progressBar: { ...progressBar, enabled } })} />
      {progressBar.enabled && (
        <NumberField
          label="Aceleração (k)"
          hint="1 = real. 3 = chega a 50% com ~20% do vídeo."
          min={1}
          max={10}
          step={0.5}
          value={progressBar.k}
          onChange={(k) => set({ progressBar: { ...progressBar, k: k ?? 1 } })}
          error={errorAt(issues, "progressBar", "k")}
        />
      )}
      <h3 className="text-sm font-semibold">Botão de compra</h3>
      <OfferSelect offers={offers} value={cta.offerId} onChange={(offerId) => set({ cta: { ...cta, offerId } })} />
      <TextField label="Texto do botão" value={cta.label} onChange={(label) => set({ cta: { ...cta, label } })} error={errorAt(issues, "cta", "label")} />
      <DurationField
        label="Aparece aos (tempo de vídeo assistido)"
        value={cta.showAt}
        onChange={(showAt) => set({ cta: { ...cta, showAt } })}
        error={errorAt(issues, "cta", "showAt")}
      />
      <h3 className="text-sm font-semibold">Toast de compras</h3>
      <CheckboxField label="Mostrar compras reais recentes" checked={toast.enabled} onChange={(enabled) => set({ toast: { ...toast, enabled } })} />
      {toast.enabled && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Começa antes do botão (s)"
            min={0}
            value={toast.leadSeconds}
            onChange={(v) => set({ toast: { ...toast, leadSeconds: v ?? 0 } })}
            error={errorAt(issues, "toast", "leadSeconds")}
          />
          <NumberField label="Compras das últimas (h)" min={1} max={168} value={toast.windowHours} onChange={(v) => set({ toast: { ...toast, windowHours: v ?? 48 } })} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">O toast usa só compras aprovadas registradas pelo webhook. Sem compras, não aparece.</p>
    </div>
  );
}
