"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { QuizDocument } from "@/features/quiz/document/schema";
import { imageUrl } from "@/features/media/cloudinary";
import { MediaView } from "@/features/media/components/media-view";
import { StepView } from "@/features/steps/registry";
import { ConsentBanner } from "@/features/tracking/client/consent-banner";
import { useTracker } from "@/features/tracking/client/use-tracker";
import { t } from "../i18n";
import { interpolate } from "../interpolate";
import { initialState, playableSteps, progress, reduce, type QuizAction } from "../engine";
import { backgroundStyle } from "../page-style";
import { PageBanner } from "./page-banner";

const BACKGROUND_WIDTH = 1600;

type Props = {
  document: QuizDocument;
  cloudName?: string;
  // Preview do Studio: começa no step escolhido e não mexe no scroll da janela.
  initialStepId?: string;
  embedded?: boolean;
  locale: string;
  bunnyHost?: string;
  // Rota do toast de compras; null no preview (sem domínio).
  purchasesEndpoint?: string | null;
  // Ausente no preview: nada é rastreado nem enviado à Meta.
  tracking?: { slug: string | null };
};

export function QuizPlayer({
  document: doc,
  cloudName,
  initialStepId,
  embedded = false,
  locale,
  bunnyHost,
  purchasesEndpoint = null,
  tracking,
}: Props) {
  const steps = playableSteps(doc);
  const { allowBack, showProgress } = doc.settings;
  const [state, rawDispatch] = useReducer(
    (s: ReturnType<typeof initialState>, a: QuizAction) => reduce(s, a, steps, { allowBack }),
    undefined,
    () => ({ ...initialState(), index: Math.max(0, steps.findIndex((s) => s.id === initialStepId)) }),
  );
  const dispatch = useCallback((action: QuizAction) => rawDispatch(action), []);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [lead, setLead] = useState<{ firstName?: string }>();
  const tracker = useTracker({ enabled: Boolean(tracking), locale, slug: tracking?.slug ?? null, pixelId: doc.tracking.metaPixelId });
  const { track } = tracker;

  // Um evento por step exibido; quiz_start só na primeira vez da sessão de página.
  const current = steps[Math.min(state.index, steps.length - 1)];
  const trackedIndex = useRef<number | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!current || trackedIndex.current === state.index) return;
    trackedIndex.current = state.index;
    if (!started.current && state.index === 0) {
      started.current = true;
      void track("quiz_start", current.id);
    }
    void track("step_view", current.id);
    if (current.type === "vsl") void track("vsl_view", current.id);
  }, [state.index, current, track]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (embedded) mainRef.current?.closest("[data-preview-scroll]")?.scrollTo({ top: 0 });
    else window.scrollTo({ top: 0 });
    const heading = mainRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [state.index, embedded]);

  // No preview o documento muda por baixo: o índice pode ficar além do fim.
  const index = Math.min(state.index, steps.length - 1);
  const step = steps[index];
  if (!step) return null;
  const canGoBack = allowBack && index > 0 && step.type !== "loading";
  // Página de VSL única: sem voltar nem barra do quiz, coluna mais larga para a headline.
  const vslPage = steps.length === 1 && step.type === "vsl";
  const background = doc.theme.background;
  const backgroundImage = background?.image && cloudName ? imageUrl(cloudName, background.image.publicId, BACKGROUND_WIDTH) : undefined;

  return (
    <div style={backgroundStyle(background, backgroundImage)} className={`flex w-full flex-col ${embedded ? "min-h-full" : "min-h-dvh"}`}>
      {step.type === "vsl" && step.banner && (
        <PageBanner text={interpolate(step.banner, { steps, answers: state.answers, lead })} style={step.bannerStyle} cloudName={cloudName} />
      )}
    <div className={`mx-auto flex w-full flex-1 flex-col px-4 ${vslPage ? "max-w-3xl pb-10" : "max-w-md"}`}>
      {(!vslPage || doc.theme.logo) && (
      <header className="flex h-14 items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "back" })}
          aria-label={t(locale, "back")}
          className={`-ml-2 grid size-10 place-items-center rounded-full text-xl ${canGoBack ? "" : "invisible"}`}
        >
          ←
        </button>
        <div className="flex flex-1 justify-center">
          {doc.theme.logo && (
            <div className="w-24">
              <MediaView media={doc.theme.logo} cloudName={cloudName} priority sizes="96px" />
            </div>
          )}
        </div>
        <span className="size-10" />
      </header>
      )}
      {showProgress && !vslPage && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--q-surface)]" aria-hidden>
          <div
            className="h-full rounded-full bg-[var(--q-primary)] transition-[width] duration-300"
            style={{ width: `${Math.round(progress({ ...state, index }, steps) * 100)}%` }}
          />
        </div>
      )}
      <main ref={mainRef} key={step.id} className="flex flex-1 flex-col pt-6 [&_h1]:outline-none">
        <StepView
          step={step}
          ctx={{ steps, answers: state.answers, lead }}
          dispatch={dispatch}
          cloudName={cloudName}
          isFirst={index === 0}
          isLast={index === steps.length - 1}
          runtime={{
            locale,
            offers: doc.offers,
            embedded,
            bunnyHost,
            purchasesEndpoint,
            track,
            onLead: (firstName) => setLead({ firstName }),
          }}
        />
      </main>
      {tracker.consent === "ask" && <ConsentBanner locale={locale} onChoose={tracker.choose} />}
    </div>
    </div>
  );
}
