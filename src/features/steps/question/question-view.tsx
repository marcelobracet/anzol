import { MediaView } from "@/features/media/components/media-view";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { InlineText } from "@/features/runtime/components/rich-text";
import { canAdvance } from "@/features/runtime/engine";
import { t } from "@/features/runtime/i18n";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import { DateSelects } from "./date-selects";
import type { QuestionStep } from "./schema";

export function QuestionView({ step, ctx, dispatch, cloudName, runtime, isFirst }: StepViewProps<QuestionStep>) {
  const chosen = ctx.answers[step.id] ?? [];
  const { selection } = step;
  const multi = selection.mode === "multi";
  const showCta = selection.mode === "multi" || !selection.autoAdvance;
  const ctaLabel = selection.mode === "multi" ? selection.ctaLabel : t(runtime.locale, "continue");
  const filled = step.optionStyle === "filled";

  return (
    <>
      {step.badge && (
        <span className="mx-auto mb-4 block w-fit rounded-full border border-[var(--q-accent)]/40 bg-[var(--q-accent)]/10 px-4 py-1 text-xs font-bold tracking-[0.14em] text-[var(--q-accent)] uppercase">
          {interpolate(step.badge, ctx)}
        </span>
      )}
      <h1 className={`text-2xl leading-tight font-bold text-balance ${step.badge ? "text-center text-3xl font-extrabold" : ""}`}>
        <InlineText text={step.title} ctx={ctx} accent />
      </h1>
      {step.subtitle && (
        <p className={`mt-2 opacity-80 ${step.badge ? "text-center text-lg text-balance" : ""}`}>
          <InlineText text={step.subtitle} ctx={ctx} />
        </p>
      )}
      {step.media && (
        <figure className="mt-5">
          <div className="overflow-hidden rounded-[var(--q-radius)]">
            <MediaView media={step.media} cloudName={cloudName} priority={isFirst} />
          </div>
          {step.mediaCaption && <figcaption className="mt-2 text-center text-sm opacity-70">{interpolate(step.mediaCaption, ctx)}</figcaption>}
        </figure>
      )}
      {step.prompt && <p className="mt-5 text-center text-lg font-bold">{interpolate(step.prompt, ctx)}</p>}
      {step.layout === "date" && step.date ? (
        <DateSelects step={step} date={step.date} chosen={chosen[0]} ctx={ctx} dispatch={dispatch} ctaLabel={interpolate(ctaLabel, ctx)} />
      ) : (
        <div
          role={multi ? "group" : "radiogroup"}
          aria-label={step.title}
          className={`grid gap-3 ${step.prompt ? "mt-3" : "mt-6"} ${step.layout === "grid" ? "grid-cols-2" : "grid-cols-1"}`}
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
                } ${optionColors(filled, selected)}`}
              >
                {option.image && <MediaView media={option.image} cloudName={cloudName} sizes="50vw" />}
                {option.emoji && <span aria-hidden className={filled ? "text-4xl" : "text-2xl"}>{option.emoji}</span>}
                <span className={filled ? "text-lg font-extrabold uppercase" : ""}>{interpolate(option.label, ctx)}</span>
              </button>
            );
          })}
        </div>
      )}
      {step.footnote && <p className="mt-4 text-center text-sm opacity-70">{interpolate(step.footnote, ctx)}</p>}
      {showCta && step.layout !== "date" && (
        <StickyCta disabled={!canAdvance(step, ctx.answers)} onClick={() => dispatch({ type: "next" })}>
          {interpolate(ctaLabel, ctx)}
        </StickyCta>
      )}
    </>
  );
}

function optionColors(filled: boolean, selected: boolean): string {
  if (filled) {
    return `border-transparent bg-[var(--q-primary)] py-5 text-[var(--q-on-primary)] shadow-md ${selected ? "ring-4 ring-[var(--q-accent)]/50" : ""}`;
  }
  return selected ? "border-[var(--q-primary)] bg-[var(--q-primary)]/10" : "border-transparent bg-[var(--q-surface)]";
}
