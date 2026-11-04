import { useEffect, useMemo, useState } from "react";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import { loadingSchedule, messageAt } from "./schedule";
import type { LoadingStep } from "./schema";

const TICK_MS = 100;

export function LoadingView({ step, ctx, dispatch, isLast }: StepViewProps<LoadingStep>) {
  const schedule = useMemo(() => loadingSchedule(step.messages), [step.messages]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const timer = setInterval(() => setElapsed(performance.now() - started), TICK_MS);
    const done = setTimeout(() => {
      if (!isLast) dispatch({ type: "next" });
    }, schedule.totalMs);
    return () => {
      clearInterval(timer);
      clearTimeout(done);
    };
  }, [schedule.totalMs, dispatch, isLast]);

  const percent = Math.min(100, Math.round((elapsed / schedule.totalMs) * 100));
  const current = schedule.slots[messageAt(schedule, elapsed)];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <h1 className="text-2xl leading-tight font-bold text-balance">{interpolate(step.title, ctx)}</h1>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-8 h-3 w-full overflow-hidden rounded-full bg-[var(--q-surface)]"
      >
        <div className="h-full bg-[var(--q-primary)] transition-[width] duration-100 ease-linear" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums">{percent}%</p>
      <p aria-live="polite" className="mt-4 min-h-6 opacity-80">
        {interpolate(current.text, ctx)}
      </p>
    </div>
  );
}
