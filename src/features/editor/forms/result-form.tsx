"use client";

import type { ResultStep } from "@/features/steps/result/schema";
import { newId } from "@/features/steps/shared/primitives";
import { ItemList, NumberField, SelectField, TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { errorAt, type EditorIssue } from "../document-ops";
import type { StepFormProps } from "./form-props";
import { RICH_TEXT_HINT } from "./info-form";

type Content = ResultStep["fallback"];
type Variant = ResultStep["variants"][number];

const CONDITIONS = [
  { value: "tag", label: "Quantidade de uma tag" },
  { value: "scoreRange", label: "Faixa de pontos" },
] as const;

function ContentFields<C extends Content>({ value, onChange, issues, prefix, cloudName }: {
  value: C;
  onChange: (value: C) => void;
  issues?: EditorIssue[];
  prefix: PropertyKey[];
  cloudName?: string;
}) {
  return (
    <>
      <TextField label="Título" value={value.title} onChange={(title) => onChange({ ...value, title })} error={errorAt(issues, ...prefix, "title")} />
      <TextField label="Texto" multiline maxLength={5000} hint={RICH_TEXT_HINT} value={value.body} onChange={(v) => onChange({ ...value, body: v || undefined })} />
      <MediaField label="Imagem ou GIF" value={value.media} cloudName={cloudName} onChange={(media) => onChange({ ...value, media })} />
    </>
  );
}

function ConditionFields({ variant, update }: { variant: Variant; update: (v: Variant) => void }) {
  const { when } = variant;
  return (
    <>
      <SelectField
        label="Mostrar quando"
        value={when.type}
        options={CONDITIONS}
        onChange={(type) => update({ ...variant, when: type === "tag" ? { type, tag: "tag", minCount: 1 } : { type } })}
      />
      {when.type === "tag" ? (
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Tag" value={when.tag} onChange={(tag) => update({ ...variant, when: { ...when, tag } })} />
          <NumberField label="Mínimo" min={1} value={when.minCount} onChange={(n) => update({ ...variant, when: { ...when, minCount: n ?? 1 } })} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Pontos de" value={when.min} onChange={(min) => update({ ...variant, when: { ...when, min } })} />
          <NumberField label="até" value={when.max} onChange={(max) => update({ ...variant, when: { ...when, max } })} />
        </div>
      )}
    </>
  );
}

export function ResultForm({ step, onChange, issues, cloudName }: StepFormProps<ResultStep>) {
  const set = (patch: Partial<ResultStep>) => onChange({ ...step, ...patch });
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">A primeira variante cuja condição casar é mostrada. Sem nenhuma, vale o resultado padrão.</p>
      <h3 className="text-sm font-semibold">Variantes</h3>
      <ItemList<Variant>
        items={step.variants}
        onChange={(variants) => set({ variants })}
        max={10}
        addLabel="Variante"
        create={() => ({ id: newId(), title: "Novo resultado", when: { type: "scoreRange", min: 0 } })}
        render={(variant, update, i) => (
          <>
            <ConditionFields variant={variant} update={update} />
            <ContentFields value={variant} onChange={update} issues={issues} prefix={["variants", i]} cloudName={cloudName} />
          </>
        )}
      />
      <h3 className="text-sm font-semibold">Resultado padrão</h3>
      <ContentFields value={step.fallback} onChange={(fallback) => set({ fallback })} issues={issues} prefix={["fallback"]} cloudName={cloudName} />
      <TextField label="Texto do botão" value={step.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} error={errorAt(issues, "ctaLabel")} />
    </div>
  );
}
