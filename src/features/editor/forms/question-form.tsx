"use client";

import type { QuestionStep } from "@/features/steps/question/schema";
import { newId } from "@/features/steps/shared/primitives";
import { CheckboxField, ItemList, NumberField, SelectField, TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";

type Option = QuestionStep["options"][number];

const MODES = [
  { value: "single", label: "Escolha única" },
  { value: "multi", label: "Múltipla escolha" },
] as const;
const LAYOUTS = [
  { value: "list", label: "Lista" },
  { value: "grid", label: "Grade (2 colunas)" },
] as const;

export function QuestionForm({ step, onChange, issues, cloudName }: StepFormProps<QuestionStep>) {
  const set = (patch: Partial<QuestionStep>) => onChange({ ...step, ...patch });
  const { selection } = step;

  return (
    <div className="grid gap-4">
      <TextField label="Pergunta" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <TextField label="Subtítulo" value={step.subtitle} onChange={(v) => set({ subtitle: v || undefined })} />
      <SelectField
        label="Tipo de resposta"
        value={selection.mode}
        options={MODES}
        onChange={(mode) =>
          set({ selection: mode === "single" ? { mode, autoAdvance: true } : { mode, min: 1, ctaLabel: "Continuar" } })
        }
      />
      {selection.mode === "single" ? (
        <CheckboxField
          label="Avançar ao escolher"
          checked={selection.autoAdvance}
          onChange={(autoAdvance) => set({ selection: { ...selection, autoAdvance } })}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Mínimo" min={1} value={selection.min} onChange={(min) => set({ selection: { ...selection, min: min ?? 1 } })} />
          <NumberField label="Máximo" min={1} value={selection.max} onChange={(max) => set({ selection: { ...selection, max } })} />
          <div className="col-span-2">
            <TextField
              label="Texto do botão"
              value={selection.ctaLabel}
              onChange={(ctaLabel) => set({ selection: { ...selection, ctaLabel } })}
              error={errorAt(issues, "selection", "ctaLabel")}
            />
          </div>
        </div>
      )}
      <SelectField label="Layout" value={step.layout} options={LAYOUTS} onChange={(layout) => set({ layout })} />
      <h3 className="text-sm font-semibold">Opções</h3>
      <ItemList<Option>
        items={step.options}
        onChange={(options) => set({ options })}
        min={2}
        max={12}
        addLabel="Opção"
        create={() => ({ id: newId(), label: "Nova opção", score: 0, tags: [] })}
        render={(option, update, i) => (
          <>
            <div className="grid grid-cols-[1fr_4rem] gap-2">
              <TextField label="Texto" value={option.label} onChange={(label) => update({ ...option, label })} error={errorAt(issues, "options", i, "label")} />
              <TextField label="Emoji" maxLength={8} value={option.emoji} onChange={(v) => update({ ...option, emoji: v || undefined })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Pontos" value={option.score} step={1} onChange={(score) => update({ ...option, score: score ?? 0 })} />
              <TextField
                label="Tags"
                hint="Separadas por vírgula"
                value={option.tags.join(", ")}
                onChange={(v) => update({ ...option, tags: v.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5) })}
              />
            </div>
            <MediaField
              label="Imagem (opcional)"
              value={option.image}
              allowAnimated={false}
              cloudName={cloudName}
              onChange={(image) => update({ ...option, image: image?.kind === "image" ? image : undefined })}
            />
          </>
        )}
      />
    </div>
  );
}
