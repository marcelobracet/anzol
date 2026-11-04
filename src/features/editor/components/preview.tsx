"use client";

import type { QuizDocument } from "@/features/quiz/document/schema";
import { QuizPlayer } from "@/features/runtime/components/quiz-player";
import { fontClassName } from "@/features/runtime/fonts";
import { themeStyle } from "@/features/runtime/theme";

type Props = { document: QuizDocument; selectedId: string | null; cloudName?: string; resetKey: number };

// Mesmo player do runtime, numa moldura de celular. Trocar de step reinicia o preview nele.
export function Preview({ document: doc, selectedId, cloudName, resetKey }: Props) {
  const selected = doc.steps.find((s) => s.id === selectedId);
  // A posição entra na key: reordenar reinicia o preview no step selecionado.
  const position = doc.steps.filter((s) => !s.hidden).findIndex((s) => s.id === selectedId);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        data-preview-scroll
        style={themeStyle(doc.theme)}
        className={`${fontClassName(doc.theme.font)} relative h-[min(740px,calc(100dvh-8rem))] w-[375px] overflow-y-auto rounded-[2.5rem] border-[10px] border-zinc-900 bg-[var(--q-bg)] text-[var(--q-text)] shadow-xl`}
      >
        <QuizPlayer key={`${selectedId}-${position}-${resetKey}`} document={doc} cloudName={cloudName} initialStepId={selectedId ?? undefined} embedded />
      </div>
      {selected?.hidden && <p className="text-xs text-amber-600">Este step está oculto e não aparece no quiz.</p>}
    </div>
  );
}
