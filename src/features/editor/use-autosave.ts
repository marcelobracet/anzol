"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizDocument } from "@/features/quiz/document/schema";
import { saveDraftAction } from "./actions";
import { createAutosaver, type AutosaveStatus } from "./autosaver";

const DELAY_MS = 800;

export function useAutosave(quizId: string, initialRevision: number) {
  const revision = useRef(initialRevision);
  const [state, setState] = useState<{ status: AutosaveStatus; error?: string }>({ status: "saved" });
  const saver = useRef<ReturnType<typeof createAutosaver<QuizDocument>> | null>(null);

  useEffect(() => {
    const instance = createAutosaver<QuizDocument>({
      delayMs: DELAY_MS,
      onStatus: (status, error) => setState({ status, error }),
      save: async (doc) => {
        const result = await saveDraftAction(quizId, doc, revision.current);
        if (result.success) revision.current = result.data.revision;
        return result;
      },
    });
    saver.current = instance;
    return () => instance.dispose();
  }, [quizId]);

  // Avisa antes de fechar a aba com alteração não salva.
  useEffect(() => {
    if (state.status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.status]);

  return {
    ...state,
    schedule: useCallback((doc: QuizDocument) => saver.current?.schedule(doc), []),
    flush: useCallback(() => saver.current?.flush() ?? Promise.resolve(true), []),
    revision: useCallback(() => revision.current, []),
  };
}
