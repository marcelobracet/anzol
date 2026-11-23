import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { answerLabels, buildAnswerReport, buildEngagement } from "@/features/dashboard/engagement";
import { parseFunnelQuery } from "@/features/dashboard/query";
import { loadAnswerStats, loadDepth, loadResponses } from "@/features/dashboard/responses";
import { quizService } from "@/features/quiz/server";
import { playableSteps } from "@/features/runtime/engine";

// Dados privados (respostas e leads) e sempre frescos.
export const instant = false;

const PAGE_SIZE = 50;
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—";

export default async function ResponsesPage({ params, searchParams }: PageProps<"/studio/quizzes/[id]/responses">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();

  await connection();
  const raw = await searchParams;
  const query = parseFunnelQuery(raw, new Date());
  const search = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Math.min(1000, Number(raw.page) || 1));
  const version = quiz.publishedVersionId ? await quizService().findVersion(quiz.publishedVersionId) : null;

  const header = (
    <div>
      <Link href={`/quizzes/${quiz.id}/funnel`} className="text-sm text-muted-foreground hover:text-foreground">← Funil</Link>
      <h1 className="mt-2 text-2xl font-semibold">Respostas · {quiz.name}</h1>
    </div>
  );
  if (!version) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        {header}
        <p className="text-sm text-muted-foreground">Publique o quiz para começar a receber respostas.</p>
      </div>
    );
  }

  const filter = { versionId: query.scope === "current" ? version.id : null, from: query.from, to: query.to };
  const steps = playableSteps(version.document);
  const data = await Promise.all([
    loadDepth(quiz.id, filter),
    loadAnswerStats(quiz.id, filter),
    loadResponses(quiz.id, filter, { search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  ]).catch((error: unknown) => {
    console.error("[responses] indisponível", String(error));
    return null;
  });

  const qs = (patch: Record<string, string | number>) =>
    `?${new URLSearchParams({ range: String(query.days), scope: query.scope, ...(search ? { q: search } : {}), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) })}`;
  const chip = (active: boolean) => `rounded-md border px-2.5 py-1 text-sm ${active ? "bg-foreground text-background" : "bg-background hover:bg-muted"}`;

  if (!data) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        {header}
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Respostas indisponíveis: aplique a migração <code>0006_answers_engagement.sql</code> no Supabase. As respostas passam a ser gravadas a partir do deploy desta versão.
        </p>
      </div>
    );
  }

  const [depth, answerStats, responses] = data;
  const engagement = buildEngagement(depth, steps.length);
  const report = buildAnswerReport(steps, answerStats.counts, answerStats.answeredByStep);
  const pages = Math.max(1, Math.ceil(responses.total / PAGE_SIZE));

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      {header}

      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => (
          <Link key={d} href={qs({ range: d, page: 1 })} className={chip(query.days === d)}>{d} dias</Link>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        <Link href={qs({ scope: "current", page: 1 })} className={chip(query.scope === "current")}>Versão {version.versionNumber}</Link>
        <Link href={qs({ scope: "all", page: 1 })} className={chip(query.scope === "all")}>Todas as versões</Link>
        <a href={`/api/studio/quizzes/${quiz.id}/responses${qs({})}`} className={`${chip(false)} ml-auto`}>Exportar CSV</a>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Visitantes", engagement.visitors.toLocaleString("pt-BR"), "Acessaram o funil"],
          ["Leads adquiridos", engagement.interacted.toLocaleString("pt-BR"), "Iniciaram alguma interação"],
          ["Taxa de interação", pct(engagement.interactionRate), "Visitantes que interagiram"],
          ["Leads qualificados", engagement.qualified.toLocaleString("pt-BR"), "+50% das etapas"],
        ].map(([label, value, hint]) => (
          <Card key={label} size="sm">
            <CardContent>
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
              <p className="text-3xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Respostas por pergunta</h2>
        {report.length === 0 && <p className="text-sm text-muted-foreground">Este quiz não tem perguntas.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {report.map((q) => (
            <Card key={q.stepId}>
              <CardHeader>
                <CardTitle className="text-base">{q.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {q.answered.toLocaleString("pt-BR")} responderam{q.multiple ? " · escolha múltipla (a soma passa de 100%)" : ""}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2">
                  {q.options.map((o) => (
                    <li key={o.id} className="grid gap-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span>{o.label}</span>
                        <span className="tabular-nums text-muted-foreground">{o.sessions.toLocaleString("pt-BR")} · {pct(o.share)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: pct(o.share) }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Pessoas ({responses.total.toLocaleString("pt-BR")})</h2>
          <form className="flex gap-2" action="">
            <input type="hidden" name="range" value={query.days} />
            <input type="hidden" name="scope" value={query.scope} />
            <input
              name="q"
              defaultValue={search}
              placeholder="Pesquisar nome, e-mail ou telefone"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
            />
            <button className="h-9 rounded-md border bg-background px-3 text-sm hover:bg-muted">Buscar</button>
          </form>
        </div>

        {responses.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma resposta no período{search ? " para essa busca" : ""}.</p>
        ) : (
          <ul className="grid gap-2">
            {responses.rows.map((r) => {
              const answers = answerLabels(steps, r.answers);
              const origin = [r.utm.utm_campaign, r.utm.utm_content].filter(Boolean).join(" · ");
              return (
                <li key={r.sessionId} className="rounded-lg border bg-background p-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {r.lead?.name || r.lead?.email || "Anônimo"}
                      {r.lead?.email && r.lead.name && <span className="ml-2 font-normal text-muted-foreground">{r.lead.email}</span>}
                      {r.lead?.phone && <span className="ml-2 font-normal text-muted-foreground">{r.lead.phone}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {when(r.lastAt)} · {r.stepsViewed}/{steps.length} etapas
                    </span>
                  </div>
                  {origin && <p className="mt-0.5 text-xs text-muted-foreground">Origem: {origin}</p>}
                  {answers.length > 0 ? (
                    <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                      {answers.map((a) => (
                        <div key={a.stepId} className="min-w-0">
                          <dt className="truncate text-xs text-muted-foreground">{a.title}</dt>
                          <dd>{a.labels.join(", ")}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Sem respostas de perguntas.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            {page > 1 ? <Link href={qs({ page: page - 1 })} className={chip(false)}>← Anteriores</Link> : <span />}
            <span className="text-muted-foreground">Página {page} de {pages}</span>
            {page < pages ? <Link href={qs({ page: page + 1 })} className={chip(false)}>Próximas →</Link> : <span />}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Respostas gravadas quando a pessoa avança de uma pergunta (se voltar e mudar, vale a última). Nome, e-mail e telefone vêm do formulário de lead e são dados pessoais: não compartilhe o CSV fora da equipe.
      </p>
    </div>
  );
}
