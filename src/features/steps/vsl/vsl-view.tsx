"use client";

import { useCallback, useSyncExternalStore } from "react";
import { goToCheckout } from "@/features/checkout/go-to-checkout";
import { QuizButton } from "@/features/runtime/components/quiz-button";
import { t } from "@/features/runtime/i18n";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import { formatDuration } from "./duration";
import { ctaVisible, toastWindowOpen } from "./progress";
import { PurchaseToast } from "./purchase-toast";
import type { VslStep } from "./schema";
import { videoSource } from "./video-source";
import { VslPlayer } from "./vsl-player";
import { readWatched, saveWatched, subscribeWatched } from "./watched-store";

export function VslView({ step, ctx, runtime }: StepViewProps<VslStep>) {
  // Tempo máximo assistido sobrevive a reload: quem já viu o CTA não precisa assistir de novo.
  // No servidor vale 0 (não há localStorage), o que evita divergência na hidratação.
  const watched = useSyncExternalStore(subscribeWatched, () => readWatched(step.id), () => 0);
  const offer = runtime.offers.find((o) => o.id === step.cta.offerId);
  const onWatched = useCallback((seconds: number) => saveWatched(step.id, seconds), [step.id]);
  const { track } = runtime;
  const onMilestone = useCallback((second: number) => void track("vsl_progress", step.id, { videoSecond: second }), [track, step.id]);

  const source = videoSource(step.video, runtime.bunnyHost);

  // No preview o CTA fica sempre visível para revisão.
  const showCta = runtime.embedded || ctaVisible(watched, step.cta.showAt);

  return (
    <>
      {step.headline && (
        <h1 className="text-center text-2xl leading-tight font-extrabold text-balance sm:text-3xl md:text-4xl">{interpolate(step.headline, ctx)}</h1>
      )}
      {step.subheadline && <p className="mt-2 text-center text-base text-balance opacity-80 sm:text-lg">{interpolate(step.subheadline, ctx)}</p>}
      <div className={step.headline || step.subheadline ? "mt-5" : ""}>
        {source ? (
          <VslPlayer step={step} source={source} locale={runtime.locale} resumeAt={watched} onWatched={onWatched} onMilestone={onMilestone} />
        ) : (
          <VideoPlaceholder vertical={step.aspect === "9:16"} label={t(runtime.locale, "videoSoon")} hint={runtime.embedded ? placeholderHint(step) : undefined} />
        )}
      </div>
      {showCta && offer && (
        <div className="mx-auto mt-6 w-full max-w-md">
          <QuizButton className="animate-in fade-in zoom-in-95 bg-[var(--q-accent)]! text-lg text-[var(--q-on-accent)]!" onClick={() => {
              void runtime.track("checkout_click", step.id);
              goToCheckout(offer, runtime.embedded);
            }}>
            {interpolate(step.cta.label, ctx)}
          </QuizButton>
          {runtime.embedded && <p className="mt-1 text-center text-xs opacity-60">No ar, aparece aos {formatDuration(step.cta.showAt)} de vídeo assistido.</p>}
        </div>
      )}
      {runtime.purchasesEndpoint && toastWindowOpen(watched, step.cta.showAt, step.toast) && (
        <PurchaseToast endpoint={runtime.purchasesEndpoint} windowHours={step.toast.windowHours} locale={runtime.locale} />
      )}
    </>
  );
}

function placeholderHint(step: VslStep): string {
  if (!step.video) return "Sem vídeo: envie no painel do step VSL.";
  return step.video.provider === "bunny" ? "Bunny sem BUNNY_CDN_HOST configurado." : "";
}

function VideoPlaceholder({ vertical, label, hint }: { vertical: boolean; label: string; hint?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-[var(--q-radius)] bg-[var(--q-primary)] p-6 text-center text-[var(--q-on-primary)] shadow-lg ${
        vertical ? "mx-auto aspect-[9/16] w-full max-w-[min(100%,24rem,calc((100dvh-9rem)*9/16))]" : "aspect-video"
      }`}
    >
      <div className="grid gap-2">
        <span className="text-4xl" aria-hidden>▶</span>
        <p className="text-lg font-bold">{label}</p>
        {hint && <p className="text-xs opacity-80">{hint}</p>}
      </div>
    </div>
  );
}
