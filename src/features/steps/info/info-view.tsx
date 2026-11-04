import { MediaView } from "@/features/media/components/media-view";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { RichText } from "@/features/runtime/components/rich-text";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import type { InfoStep } from "./schema";

export function InfoView({ step, ctx, dispatch, cloudName, isFirst, isLast }: StepViewProps<InfoStep>) {
  return (
    <>
      {step.media && <MediaView media={step.media} cloudName={cloudName} priority={isFirst} />}
      <h1 className="mt-6 text-2xl leading-tight font-bold text-balance">{interpolate(step.title, ctx)}</h1>
      {step.body && <RichText text={step.body} ctx={ctx} className="mt-3 text-base leading-relaxed opacity-90" />}
      {!isLast && <StickyCta onClick={() => dispatch({ type: "next" })}>{interpolate(step.ctaLabel, ctx)}</StickyCta>}
    </>
  );
}
