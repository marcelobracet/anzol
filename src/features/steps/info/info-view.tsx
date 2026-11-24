import { MediaView } from "@/features/media/components/media-view";
import { VoiceNoteView } from "@/features/media/voice-note/voice-note-view";
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
      {step.voiceNote && <VoiceNoteView note={step.voiceNote} />}
      {step.body && <RichText text={step.body} ctx={ctx} className="mt-3 text-base leading-relaxed opacity-90" />}
      {step.below?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem do R2 (sem otimizador do Cloudinary)
        <img
          src={step.below.imageUrl}
          alt={step.below.imageAlt ?? ""}
          loading="lazy"
          className="mt-5 w-full rounded-[var(--q-radius)] object-cover"
        />
      )}
      {step.below?.text && <RichText text={step.below.text} ctx={ctx} className="mt-4 text-base leading-relaxed opacity-90" />}
      {!isLast && <StickyCta onClick={() => dispatch({ type: "next" })}>{interpolate(step.ctaLabel, ctx)}</StickyCta>}
    </>
  );
}
