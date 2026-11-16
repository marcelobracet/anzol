"use client";

import { useState, type Dispatch } from "react";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import type { QuizAction } from "@/features/runtime/engine";
import { interpolate, type InterpolationContext } from "@/features/runtime/interpolate";
import type { DateParts, QuestionStep } from "./schema";

type Props = {
  step: QuestionStep;
  date: DateParts;
  chosen: string | undefined; // opção (mês) já escolhida
  ctx: InterpolationContext;
  dispatch: Dispatch<QuizAction>;
  ctaLabel: string;
};

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Dia e ano ficam só na tela: a resposta do quiz é o mês (opção com tags e pontos).
export function DateSelects({ step, date, chosen, ctx, dispatch, ctaLabel }: Props) {
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const placeholder = date.placeholder ?? "—";
  const ready = Boolean(day && year && chosen);

  return (
    <>
      <div className="mt-6 grid gap-4">
        <DateSelect label={interpolate(date.dayLabel, ctx)} value={day} placeholder={placeholder} onChange={setDay}>
          {range(1, 31).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </DateSelect>
        <DateSelect
          label={interpolate(date.monthLabel, ctx)}
          value={chosen ?? ""}
          placeholder={placeholder}
          onChange={(optionId) => dispatch({ type: "select", stepId: step.id, optionId })}
        >
          {step.options.map((o) => (
            <option key={o.id} value={o.id}>{interpolate(o.label, ctx)}</option>
          ))}
        </DateSelect>
        <DateSelect label={interpolate(date.yearLabel, ctx)} value={year} placeholder={placeholder} onChange={setYear}>
          {range(date.yearFrom, date.yearTo).reverse().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </DateSelect>
      </div>
      <StickyCta disabled={!ready} onClick={() => dispatch({ type: "next" })}>
        {ctaLabel}
      </StickyCta>
    </>
  );
}

function DateSelect({
  label,
  value,
  placeholder,
  onChange,
  children,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-left">
      <span className="text-sm font-semibold opacity-70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-14 w-full appearance-none rounded-[var(--q-radius)] border-2 bg-[var(--q-surface)] px-4 text-base font-bold ${
          value ? "border-[var(--q-primary)]" : "border-transparent opacity-80"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
    </label>
  );
}
