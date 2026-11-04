"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { validateForPublish } from "@/features/quiz/document/publish-rules";
import type { QuizDocument } from "@/features/quiz/document/schema";
import { publishAction } from "../actions";

type Props = {
  quizId: string;
  document: QuizDocument;
  draftValid: boolean;
  flush: () => Promise<boolean>;
  revision: () => number;
  onSelectStep: (id: string) => void;
};

export function PublishButton({ quizId, document: doc, draftValid, flush, revision, onSelectStep }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const issues = validateForPublish(doc);
  const blocked = !draftValid || issues.length > 0;

  const publish = () =>
    startTransition(async () => {
      setMessage(null);
      if (!(await flush())) {
        setOpen(true);
        setMessage({ ok: false, text: "Não foi possível salvar o rascunho antes de publicar." });
        return;
      }
      const result = await publishAction(quizId, revision());
      setOpen(true);
      if (result.success) router.refresh(); // status e link "ver no ar" vêm do servidor
      setMessage(result.success ? { ok: true, text: `Versão ${result.data.versionNumber} publicada.` } : { ok: false, text: result.error });
    });

  return (
    <div className="relative flex items-center gap-2">
      {blocked && (
        <button type="button" className="text-xs text-amber-700 hover:underline" onClick={() => setOpen((o) => !o)}>
          {!draftValid ? "Campos com erro" : `${issues.length} pendência(s)`}
        </button>
      )}
      <Button onClick={publish} disabled={pending || blocked}>
        {pending ? "Publicando…" : "Publicar"}
      </Button>
      {open && (blocked || message) && (
        <div className="absolute top-full right-0 z-20 mt-2 grid w-72 gap-2 rounded-lg border bg-background p-3 text-xs shadow-lg">
          <button type="button" className="justify-self-end text-muted-foreground" onClick={() => setOpen(false)} aria-label="Fechar">✕</button>
          {message && <p className={message.ok ? "text-emerald-700" : "text-destructive"}>{message.text}</p>}
          {!draftValid && <p className="text-destructive">Corrija os campos marcados para publicar.</p>}
          {issues.length > 0 && (
            <ul className="grid gap-1">
              {issues.map((issue, i) => (
                <li key={i}>
                  {issue.stepId ? (
                    <button type="button" className="text-left text-amber-700 underline-offset-2 hover:underline" onClick={() => onSelectStep(issue.stepId!)}>
                      {issue.message}
                    </button>
                  ) : (
                    <span className="text-amber-700">{issue.message}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
