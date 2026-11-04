"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDomainAction, removeDomainAction, type DomainFormState } from "../actions";
import type { QuizDomain } from "../repository";

type Props = { quizId: string; slug: string; domains: QuizDomain[] };

export function DomainsCard({ quizId, slug, domains }: Props) {
  const [state, formAction, pending] = useActionState<DomainFormState, FormData>(addDomainAction.bind(null, quizId), null);

  return (
    <div className="grid gap-4">
      {domains.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum domínio ligado. O quiz só fica no ar depois de ligar um domínio e publicar.</p>
      ) : (
        <ul className="grid gap-2">
          {domains.map((d) => (
            <li key={d.host} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                https://{d.host}{d.isDefault ? "/" : `/${slug}`}
                {d.isDefault && <span className="ml-2 text-xs text-muted-foreground">(quiz padrão do domínio)</span>}
              </span>
              <form action={removeDomainAction.bind(null, quizId, d.host)}>
                <Button type="submit" variant="ghost" size="sm">Desligar</Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <label htmlFor="host" className="text-sm font-medium">Domínio da oferta</label>
          <Input id="host" name="host" placeholder="oferta.com" required maxLength={253} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Ligando…" : "Ligar domínio"}</Button>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="makeDefault" className="size-4" /> Usar como quiz padrão (abre na raiz do domínio)
        </label>
      </form>

      {state && !state.success && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{state.data.host} cadastrado na Vercel.</p>
          {state.data.verified ? (
            <p className="text-muted-foreground">Aponte o DNS para a Vercel (CNAME cname.vercel-dns.com ou A 76.76.21.21) se ainda não apontou.</p>
          ) : (
            <>
              <p className="text-muted-foreground">Crie estes registros DNS para verificar o domínio:</p>
              <ul className="mt-1 font-mono text-xs">
                {state.data.verification.map((v) => (
                  <li key={`${v.type}-${v.domain}`}>{v.type} {v.domain} → {v.value}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
