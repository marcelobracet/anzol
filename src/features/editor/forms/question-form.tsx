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
  { value: "date", label: "Data (dia, mês e ano)" },
] as const;
const OPTION_STYLES = [
  { value: "card", label: "Cartão claro" },
  { value: "filled", label: "Botão na cor primária" },
] as const;

export function QuestionForm({ step, onChange, issues, cloudName }: StepFormProps<QuestionStep>) {
  const set = (patch: Partial<QuestionStep>) => onChange({ ...step, ...patch });
  const { selection } = step;

  return (
    <div className="grid gap-4">
      <TextField label="Selo (opcional)" hint="Ex.: TESTE GRATUITO. Bom para a primeira tela." value={step.badge} onChange={(v) => set({ badge: v || undefined })} />
      <TextField label="Pergunta" hint="==trecho== fica na cor de destaque" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <TextField label="Subtítulo" hint="**negrito** permitido" value={step.subtitle} onChange={(v) => set({ subtitle: v || undefined })} />
      <MediaField label="Imagem acima das opções (opcional)" value={step.media} cloudName={cloudName} onChange={(media) => set({ media })} />
      {step.media && (
        <TextField label="Legenda da imagem" value={step.mediaCaption} onChange={(v) => set({ mediaCaption: v || undefined })} />
      )}
      <TextField label="Rótulo acima das opções" hint="Ex.: Você é:" value={step.prompt} onChange={(v) => set({ prompt: v || undefined })} />
      <TextField label="Rodapé" hint="Ex.: ⏱ Leva menos de 2 minutos · 🔒 100% anônimo" value={step.footnote} onChange={(v) => set({ footnote: v || undefined })} />
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
      <SelectField
        label="Layout"
        value={step.layout}
        options={LAYOUTS}
        onChange={(layout) =>
          set(
            layout === "date"
              ? {
                  layout,
                  selection: { mode: "single", autoAdvance: false },
                  date: step.date ?? { dayLabel: "Dia", monthLabel: "Mês", yearLabel: "Ano", yearFrom: 1940, yearTo: new Date().getFullYear() - 18 },
                }
              : { layout },
          )
        }
      />
      {step.layout === "date" && step.date ? (
        <DateForm date={step.date} onChange={(date) => set({ date })} />
      ) : (
        <SelectField label="Estilo das opções" value={step.optionStyle} options={OPTION_STYLES} onChange={(optionStyle) => set({ optionStyle })} />
      )}
      {step.layout === "date" && <p className="text-xs opacity-70">As opções abaixo são os meses: só o mês vira resposta (tags e pontos).</p>}
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

type DateValue = NonNullable<QuestionStep["date"]>;

function DateForm({ date, onChange }: { date: DateValue; onChange: (d: DateValue) => void }) {
  const set = (patch: Partial<DateValue>) => onChange({ ...date, ...patch });
  return (
    <div className="grid grid-cols-3 gap-2">
      <TextField label="Rótulo dia" value={date.dayLabel} onChange={(dayLabel) => set({ dayLabel })} />
      <TextField label="Rótulo mês" value={date.monthLabel} onChange={(monthLabel) => set({ monthLabel })} />
      <TextField label="Rótulo ano" value={date.yearLabel} onChange={(yearLabel) => set({ yearLabel })} />
      <NumberField label="Ano de" value={date.yearFrom} onChange={(v) => set({ yearFrom: v ?? date.yearFrom })} />
      <NumberField label="Ano até" value={date.yearTo} onChange={(v) => set({ yearTo: v ?? date.yearTo })} />
      <TextField label="Texto vazio" value={date.placeholder} onChange={(v) => set({ placeholder: v || undefined })} />
    </div>
  );
}
