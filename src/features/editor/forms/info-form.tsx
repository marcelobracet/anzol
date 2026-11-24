"use client";

import type { InfoStep } from "@/features/steps/info/schema";
import { TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { R2ImageField } from "../components/r2-image-field";
import { VoiceNoteField } from "../components/voice-note-field";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";

export const RICH_TEXT_HINT = "**negrito**, *itálico*, ==destaque==, {{answer.<id>}}";

export function InfoForm({ step, onChange, issues, cloudName, quizId }: StepFormProps<InfoStep>) {
  const set = (patch: Partial<InfoStep>) => onChange({ ...step, ...patch });
  const below = step.below ?? {};
  // Bloco vazio vira undefined: o documento não guarda objeto sem conteúdo.
  const setBelow = (patch: Partial<NonNullable<InfoStep["below"]>>) => {
    const next = { ...below, ...patch };
    set({ below: next.imageUrl || next.text ? next : undefined });
  };
  return (
    <div className="grid gap-4">
      <TextField label="Título" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <TextField label="Texto" multiline maxLength={5000} hint={RICH_TEXT_HINT} value={step.body} onChange={(v) => set({ body: v || undefined })} />
      <MediaField label="Imagem ou GIF" value={step.media} cloudName={cloudName} onChange={(media) => set({ media })} />
      <VoiceNoteField value={step.voiceNote} quizId={quizId} onChange={(voiceNote) => set({ voiceNote })} />
      <div className="grid gap-3 rounded-lg border bg-background p-3">
        <h3 className="text-sm font-semibold">Abaixo do áudio</h3>
        <R2ImageField
          label="Imagem"
          hint="JPG, PNG ou WebP até 5 MB. Largura total da tela."
          value={below.imageUrl}
          quizId={quizId}
          onChange={(imageUrl) => setBelow({ imageUrl })}
        />
        {below.imageUrl && (
          <TextField label="Descrição da imagem (acessibilidade)" maxLength={200} value={below.imageAlt} onChange={(v) => setBelow({ imageAlt: v || undefined })} />
        )}
        <TextField label="Texto" multiline maxLength={5000} hint={RICH_TEXT_HINT} value={below.text} onChange={(v) => setBelow({ text: v || undefined })} />
      </div>
      <TextField label="Texto do botão" value={step.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} error={errorAt(issues, "ctaLabel")} />
    </div>
  );
}
