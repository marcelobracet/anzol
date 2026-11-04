import { MediaView } from "@/features/media/components/media-view";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { canAdvance } from "@/features/runtime/engine";
import { t } from "@/features/runtime/i18n";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import type { QuestionStep } from "./schema";

export function QuestionView({ step, ctx, dispatch, cloudName, runtime }: StepViewProps<QuestionStep>) {
  const chosen = ctx.answers[step.id] ?? [];
  const { selection } = step;
  const multi = selection.mode === "multi";
  const showCta = selection.mode === "multi" || !selection.autoAdvance;
  const ctaLabel = selection.mode === "multi" ? selection.ctaLabel : t(runtime.locale, "continue");

  return (
    <>
      <h1 className="text-2xl leading-tight font-bold text-balance">{interpolate(step.title, ctx)}</h1>
      {step.subtitle && <p className="mt-2 opacity-80">{interpolate(step.subtitle, ctx)}</p>}
      <div
        role={multi ? "group" : "radiogroup"}
        aria-label={step.title}
        className={`mt-6 grid gap-3 ${step.layout === "grid" ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {step.options.map((option) => {
          const selected = chosen.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={selected}
              onClick={() => dispatch({ type: "select", stepId: step.id, optionId: option.id })}
              className={`flex min-h-14 items-center gap-3 rounded-[var(--q-radius)] border-2 px-4 py-3 text-left text-base font-medium transition active:scale-[0.98] ${
                step.layout === "grid" ? "flex-col justify-center text-center" : ""
              } ${
                selected
                  ? "border-[var(--q-primary)] bg-[var(--q-primary)]/10"
                  : "border-transparent bg-[var(--q-surface)]"
              }`}
            >
              {option.image && <MediaView media={option.image} cloudName={cloudName} sizes="50vw" />}
              {option.emoji && <span aria-hidden className="text-2xl">{option.emoji}</span>}
              <span>{interpolate(option.label, ctx)}</span>
            </button>
          );
        })}
      </div>
      {showCta && (
        <StickyCta disabled={!canAdvance(step, ctx.answers)} onClick={() => dispatch({ type: "next" })}>
          {interpolate(ctaLabel, ctx)}
        </StickyCta>
      )}
    </>
  );
}
