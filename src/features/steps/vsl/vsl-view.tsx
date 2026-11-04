"use client";

import { useCallback, useSyncExternalStore } from "react";
import { goToCheckout } from "@/features/checkout/go-to-checkout";
import { QuizButton } from "@/features/runtime/components/quiz-button";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import { ctaVisible, toastWindowOpen } from "./progress";
import { PurchaseToast } from "./purchase-toast";
import type { VslStep } from "./schema";
import { VslPlayer } from "./vsl-player";
import { readWatched, saveWatched, subscribeWatched } from "./watched-store";

export function VslView({ step, ctx, runtime }: StepViewProps<VslStep>) {
  // Tempo máximo assistido sobrevive a reload: quem já viu o CTA não precisa assistir de novo.
  // No servidor vale 0 (não há localStorage), o que evita divergência na hidratação.
  const watched = useSyncExternalStore(subscribeWatched, () => readWatched(step.id), () => 0);
  const offer = runtime.offers.find((o) => o.id === step.cta.offerId);
  const onWatched = useCallback((seconds: number) => saveWatched(step.id, seconds), [step.id]);

  // No preview o CTA fica sempre visível para revisão.
  const showCta = runtime.embedded || ctaVisible(watched, step.cta.showAt);

  return (
    <>
      {step.headline && <h1 className="mb-4 text-2xl leading-tight font-bold text-balance">{interpolate(step.headline, ctx)}</h1>}
      {runtime.bunnyHost ? (
        <VslPlayer step={step} bunnyHost={runtime.bunnyHost} locale={runtime.locale} resumeAt={watched} onWatched={onWatched} />
      ) : (
        <div className="grid aspect-video place-items-center rounded-[var(--q-radius)] bg-black/80 p-4 text-center text-sm text-white">
          Vídeo {step.video.videoId || "não definido"} (configure BUNNY_CDN_HOST)
        </div>
      )}
      {showCta && offer && (
        <div className="mt-6">
          <QuizButton className="animate-in fade-in zoom-in-95 bg-[var(--q-accent)]! text-lg text-[var(--q-on-accent)]!" onClick={() => {
              void runtime.track("checkout_click", step.id);
              goToCheckout(offer, runtime.embedded);
            }}>
            {interpolate(step.cta.label, ctx)}
          </QuizButton>
          {runtime.embedded && <p className="mt-1 text-center text-xs opacity-60">No ar, aparece aos {step.cta.showAt}s de vídeo assistido.</p>}
        </div>
      )}
      {runtime.purchasesEndpoint && toastWindowOpen(watched, step.cta.showAt, step.toast) && (
        <PurchaseToast endpoint={runtime.purchasesEndpoint} windowHours={step.toast.windowHours} locale={runtime.locale} />
      )}
    </>
  );
}
