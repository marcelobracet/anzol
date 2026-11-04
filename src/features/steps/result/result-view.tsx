import { MediaView } from "@/features/media/components/media-view";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { RichText } from "@/features/runtime/components/rich-text";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import { pickResult } from "./pick-result";
import type { ResultStep } from "./schema";

export function ResultView({ step, ctx, dispatch, cloudName, isLast }: StepViewProps<ResultStep>) {
  const content = pickResult(step, ctx.steps, ctx.answers);
  return (
    <>
      {content.media && <MediaView media={content.media} cloudName={cloudName} priority />}
      <h1 className="mt-6 text-3xl leading-tight font-bold text-balance">{interpolate(content.title, ctx)}</h1>
      {content.body && <RichText text={content.body} ctx={ctx} className="mt-3 text-base leading-relaxed opacity-90" />}
      {!isLast && <StickyCta onClick={() => dispatch({ type: "next" })}>{interpolate(step.ctaLabel, ctx)}</StickyCta>}
    </>
  );
}
