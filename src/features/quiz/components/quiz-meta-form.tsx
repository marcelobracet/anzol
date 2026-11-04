"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "../actions";
import { CURRENCIES, LOCALES, type QuizMetaInput } from "../types";

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  defaults?: Partial<QuizMetaInput>;
  submitLabel: string;
  successMessage?: string;
  // Só na criação: começar de um template.
  templates?: { id: string; name: string; builtIn: boolean }[];
};

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QuizMetaForm({ action, defaults, submitLabel, successMessage, templates }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required maxLength={120} defaultValue={defaults?.name} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={defaults?.slug} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="locale">Idioma / região</Label>
        <select id="locale" name="locale" className={selectClass} defaultValue={defaults?.locale ?? "es-MX"}>
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>{locale}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="currency">Moeda</Label>
        <select id="currency" name="currency" className={selectClass} defaultValue={defaults?.currency ?? "MXN"}>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
      </div>
      {templates && (
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="templateId">Começar de</Label>
          <select id="templateId" name="templateId" className={selectClass} defaultValue="">
            <option value="">Quiz em branco</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.builtIn ? " (padrão)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : submitLabel}</Button>
        {state && !state.success && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        {state?.success && successMessage && <p className="text-sm text-muted-foreground">{successMessage}</p>}
      </div>
    </form>
  );
}
