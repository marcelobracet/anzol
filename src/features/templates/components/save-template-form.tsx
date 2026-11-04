"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/features/quiz/actions";
import { saveAsTemplateAction } from "../actions";

export function SaveTemplateForm({ quizId, defaultName }: { quizId: string; defaultName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAsTemplateAction.bind(null, quizId), null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="grid gap-1.5">
        <label htmlFor="template-name" className="text-sm font-medium">Nome do template</label>
        <Input id="template-name" name="name" required maxLength={80} defaultValue={defaultName} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar como template"}</Button>
      {state && !state.success && <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-muted-foreground sm:col-span-2">Template salvo. Use em “Novo quiz → Começar de”.</p>}
    </form>
  );
}
