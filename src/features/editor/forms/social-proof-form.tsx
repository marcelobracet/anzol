"use client";

import type { SocialProofStep } from "@/features/steps/social-proof/schema";
import { newId } from "@/features/steps/shared/primitives";
import { CheckboxField, SelectField, TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";

const LAYOUTS = [
  { value: "carousel", label: "Carrossel" },
  { value: "stack", label: "Lista" },
] as const;

export function SocialProofForm({ step, onChange, issues, cloudName }: StepFormProps<SocialProofStep>) {
  const set = (patch: Partial<SocialProofStep>) => onChange({ ...step, ...patch });
  const items = step.items;
  const updateItem = (index: number, patch: Partial<SocialProofStep["items"][number]>) =>
    set({ items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  return (
    <div className="grid gap-4">
      <TextField label="Título" value={step.title} onChange={(v) => set({ title: v || undefined })} />
      <SelectField label="Layout" value={step.layout} options={LAYOUTS} onChange={(layout) => set({ layout })} />
      <h3 className="text-sm font-semibold">Depoimentos</h3>
      {errorAt(issues, "items") && <p className="text-xs text-destructive">Adicione ao menos um depoimento.</p>}
      {items.map((item, i) => (
        <div key={item.id} className="grid gap-2 rounded-lg border bg-background p-3">
          <MediaField
            label={`Depoimento ${i + 1}`}
            value={item.image}
            allowAnimated={false}
            cloudName={cloudName}
            onChange={(image) =>
              image?.kind === "image" ? updateItem(i, { image }) : set({ items: items.filter((_, j) => j !== i) })
            }
          />
          <TextField label="Legenda" value={item.caption} onChange={(v) => updateItem(i, { caption: v || undefined })} />
          <CheckboxField
            label="Tenho autorização de uso desta imagem"
            checked={item.consentConfirmed}
            onChange={(consentConfirmed) => updateItem(i, { consentConfirmed })}
          />
        </div>
      ))}
      {items.length < 10 && (
        <MediaField
          label="+ Adicionar depoimento (imagem)"
          value={undefined}
          allowAnimated={false}
          cloudName={cloudName}
          onChange={(image) => {
            if (image?.kind === "image") set({ items: [...items, { id: newId(), image, consentConfirmed: false }] });
          }}
        />
      )}
      <p className="text-xs text-muted-foreground">Só publica com a autorização marcada em todos os depoimentos.</p>
      <TextField label="Texto do botão" value={step.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} error={errorAt(issues, "ctaLabel")} />
    </div>
  );
}
