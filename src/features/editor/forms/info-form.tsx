"use client";

import type { InfoStep } from "@/features/steps/info/schema";
import { TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";

export const RICH_TEXT_HINT = "**negrito**, *itálico*, ==destaque==, {{answer.<id>}}";

export function InfoForm({ step, onChange, issues, cloudName }: StepFormProps<InfoStep>) {
  const set = (patch: Partial<InfoStep>) => onChange({ ...step, ...patch });
  return (
    <div className="grid gap-4">
      <TextField label="Título" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <TextField label="Texto" multiline maxLength={5000} hint={RICH_TEXT_HINT} value={step.body} onChange={(v) => set({ body: v || undefined })} />
      <MediaField label="Imagem ou GIF" value={step.media} cloudName={cloudName} onChange={(media) => set({ media })} />
      <TextField label="Texto do botão" value={step.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} error={errorAt(issues, "ctaLabel")} />
    </div>
  );
}
