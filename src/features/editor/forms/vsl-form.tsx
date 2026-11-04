"use client";

import type { VslStep } from "@/features/steps/vsl/schema";
import { CheckboxField, NumberField, TextField } from "../components/fields";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";
import { OfferSelect } from "./offer-select";

export function VslForm({ step, onChange, issues, offers }: StepFormProps<VslStep>) {
  const set = (patch: Partial<VslStep>) => onChange({ ...step, ...patch });
  const { cta, toast, progressBar, video } = step;
  return (
    <div className="grid gap-4">
      <TextField label="Headline (opcional)" value={step.headline} onChange={(v) => set({ headline: v || undefined })} />
      <h3 className="text-sm font-semibold">Vídeo (Bunny Stream)</h3>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Library ID" value={video.libraryId} maxLength={40} onChange={(libraryId) => set({ video: { ...video, libraryId: libraryId.trim() } })} error={errorAt(issues, "video", "libraryId")} />
        <TextField label="Video ID" value={video.videoId} maxLength={60} onChange={(videoId) => set({ video: { ...video, videoId: videoId.trim() } })} error={errorAt(issues, "video", "videoId")} />
      </div>
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
      <NumberField
        label="Aparece aos (segundos de vídeo)"
        min={0}
        value={cta.showAt}
        onChange={(showAt) => set({ cta: { ...cta, showAt: showAt ?? 0 } })}
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
