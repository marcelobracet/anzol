"use client";

import { useEffect, useState } from "react";
import { goToCheckout } from "@/features/checkout/go-to-checkout";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { t } from "@/features/runtime/i18n";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import { countdown, type Countdown } from "./countdown";
import type { OfferTimerStep } from "./schema";

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

export function OfferTimerView({ step, ctx, runtime, dispatch, isLast }: StepViewProps<OfferTimerStep>) {
  const offer = runtime.offers.find((o) => o.id === step.offerId);
  // Calculado só no cliente: o HTML do servidor não sabe a hora de quem abre.
  const [remaining, setRemaining] = useState<Countdown | null>(null);

  useEffect(() => {
    const update = () => setRemaining(countdown(offer?.promo?.expiresAt, new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [offer?.promo?.expiresAt]);

  const onCta = () => {
    if (!isLast || !offer) return dispatch({ type: "next" });
    void runtime.track("checkout_click", step.id);
    goToCheckout(offer, runtime.embedded);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        {remaining?.expired ? (
          <p className="text-xl font-semibold text-balance">{interpolate(step.expiredText, ctx)}</p>
        ) : (
          <>
            <h1 className="text-2xl leading-tight font-bold text-balance">{interpolate(step.title, ctx)}</h1>
            <div className="mt-6 grid w-full grid-cols-4 gap-2" role="timer" aria-live="off">
              {UNITS.map((unit) => (
                <div key={unit} className="min-w-0 rounded-[var(--q-radius)] bg-[var(--q-surface)] px-1 py-3">
                  <span className={`block font-bold tabular-nums ${remaining && remaining[unit] > 999 ? "text-xl" : "text-3xl"}`}>
                    {remaining ? String(remaining[unit]).padStart(2, "0") : "--"}
                  </span>
                  <span className="text-xs opacity-70">{t(runtime.locale, unit)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Antes de outro step (ex.: VSL) avança; como último step, leva ao checkout. */}
      {(!isLast || offer) && (
        <StickyCta onClick={onCta}>
          {interpolate(step.ctaLabel, ctx)}
        </StickyCta>
      )}
    </div>
  );
}
