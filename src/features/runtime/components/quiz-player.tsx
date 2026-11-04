"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { QuizDocument } from "@/features/quiz/document/schema";
import { MediaView } from "@/features/media/components/media-view";
import { StepView } from "@/features/steps/registry";
import { initialState, playableSteps, progress, reduce, type QuizAction } from "../engine";

type Props = { document: QuizDocument; cloudName?: string };

export function QuizPlayer({ document: doc, cloudName }: Props) {
  const steps = playableSteps(doc);
  const { allowBack, showProgress } = doc.settings;
  const [state, rawDispatch] = useReducer(
    (s: ReturnType<typeof initialState>, a: QuizAction) => reduce(s, a, steps, { allowBack }),
    undefined,
    initialState,
  );
  const dispatch = useCallback((action: QuizAction) => rawDispatch(action), []);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    const heading = mainRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [state.index]);

  const step = steps[state.index];
  const canGoBack = allowBack && state.index > 0 && step.type !== "loading";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <header className="flex h-14 items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "back" })}
          aria-label="Voltar"
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
      {showProgress && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--q-surface)]" aria-hidden>
          <div
            className="h-full rounded-full bg-[var(--q-primary)] transition-[width] duration-300"
            style={{ width: `${Math.round(progress(state, steps) * 100)}%` }}
          />
        </div>
      )}
      <main ref={mainRef} key={step.id} className="flex flex-1 flex-col pt-6 [&_h1]:outline-none">
        <StepView
          step={step}
          ctx={{ steps, answers: state.answers }}
          dispatch={dispatch}
          cloudName={cloudName}
          isFirst={state.index === 0}
          isLast={state.index === steps.length - 1}
        />
      </main>
    </div>
  );
}
