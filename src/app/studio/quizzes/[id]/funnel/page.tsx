import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { buildEngagement, type Engagement } from "@/features/dashboard/engagement";
import { buildFunnel } from "@/features/dashboard/funnel";
import { parseFunnelQuery } from "@/features/dashboard/query";
import { RetentionCard } from "@/features/dashboard/components/retention-card";
import { buildRetention } from "@/features/dashboard/retention";
import { loadDepth } from "@/features/dashboard/responses";
import { loadFunnelStats, loadRetentionStats } from "@/features/dashboard/stats";
import { quizService } from "@/features/quiz/server";
import { playableSteps } from "@/features/runtime/engine";

// Dados privados e sempre frescos.
export const instant = false;

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

export default async function FunnelPage({ params, searchParams }: PageProps<"/studio/quizzes/[id]/funnel">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();

  await connection(); // o período depende da hora atual: sempre no request
  const query = parseFunnelQuery(await searchParams, new Date());
  const version = quiz.publishedVersionId ? await quizService().findVersion(quiz.publishedVersionId) : null;

  const header = (
    <div>
      <Link href={`/quizzes/${quiz.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao editor</Link>
      <h1 className="mt-2 text-2xl font-semibold">Funil · {quiz.name}</h1>
    </div>
  );

  if (!version) {
    return (
      <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
        {header}
        <p className="text-sm text-muted-foreground">Publique o quiz para começar a medir o funil.</p>
      </div>
    );
  }

  const filter = { versionId: query.scope === "current" ? version.id : null, from: query.from, to: query.to };
  const steps = playableSteps(version.document);
  const [stats, retentionStats, engagement] = await Promise.all([
    loadFunnelStats(quiz.id, filter),
    loadRetentionStats(quiz.id, filter),
    // Sem a migração 0006 o resto do painel continua funcionando.
    loadDepth(quiz.id, filter).then(
      (depth): Engagement | null => buildEngagement(depth, steps.length),
      (error: unknown) => {
        console.error("[funnel] engajamento indisponível", String(error));
        return null;
      },
    ),
  ]);
  const funnel = buildFunnel(steps, stats.counts, stats.purchases);
  const vslViews = (stepId: string) => stats.counts.filter((c) => c.type === "vsl_view" && c.stepId === stepId).reduce((sum, c) => sum + c.sessions, 0);
  const retentions = steps.flatMap((s) =>
    s.type === "vsl"
      ? [{ step: s, retention: buildRetention(retentionStats[s.id] ?? [], { views: vslViews(s.id), ctaAt: s.cta.showAt }) }]
      : [],
  );
  const link = (patch: Partial<{ range: number; scope: string }>) =>
    `?${new URLSearchParams({ range: String(patch.range ?? query.days), scope: patch.scope ?? query.scope })}`;
  const chip = (active: boolean) => `rounded-md border px-2.5 py-1 text-sm ${active ? "bg-foreground text-background" : "bg-background hover:bg-muted"}`;

  const summary = [
    ["Visitantes", funnel.summary.visitors.toLocaleString("pt-BR")],
    ["Leads (formulário)", funnel.summary.leads.toLocaleString("pt-BR")],
    ["Cliques no checkout", funnel.summary.checkouts.toLocaleString("pt-BR")],
    ["Compras", funnel.summary.purchases.toLocaleString("pt-BR")],
    ["Conversão", pct(funnel.summary.conversion)],
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
      {header}
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => (
          <Link key={d} href={link({ range: d })} className={chip(query.days === d)}>{d} dias</Link>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        <Link href={link({ scope: "current" })} className={chip(query.scope === "current")}>Versão {version.versionNumber}</Link>
        <Link href={link({ scope: "all" })} className={chip(query.scope === "all")}>Todas as versões</Link>
      </div>

      {engagement ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Visitantes", engagement.visitors.toLocaleString("pt-BR"), "Acessaram o funil"],
            ["Leads adquiridos", engagement.interacted.toLocaleString("pt-BR"), "Iniciaram alguma interação com o funil"],
            ["Taxa de interação", pct(engagement.interactionRate), "Visitantes que interagiram com o funil"],
            ["Leads qualificados", engagement.qualified.toLocaleString("pt-BR"), `+50% das etapas · ${pct(engagement.qualifiedRate)} dos visitantes`],
          ].map(([label, value, hint]) => (
            <Card key={label} size="sm">
              <CardContent>
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
                <p className="text-3xl font-semibold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </CardContent>
            </Card>
          ))}
          <p className="col-span-full text-xs text-muted-foreground">
            Fluxos completos (chegaram à última etapa): {engagement.completed.toLocaleString("pt-BR")} · {pct(engagement.completedRate)}.{" "}
            <Link href={`/quizzes/${quiz.id}/responses${link({})}`} className="underline">Ver respostas das pessoas →</Link>
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Indicadores de interação indisponíveis: aplique a migração <code>0006_answers_engagement.sql</code> no Supabase.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summary.map(([label, value]) => (
          <Card key={label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.purchases.revenue.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Receita aprovada:{" "}
          {stats.purchases.revenue
            .map((r) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: r.currency }).format(r.amount))
            .join(" · ")}
        </p>
      )}

      <Card>
        <CardHeader><CardTitle>Etapas (sessões únicas)</CardTitle></CardHeader>
        <CardContent>
          <ol className="grid gap-3">
            {funnel.rows.map((row) => (
              <li key={row.key} className="grid gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.sessions.toLocaleString("pt-BR")} · {pct(row.fromStart)}
                    {row.dropFromPrevious > 0 && <span className="ml-2 text-destructive">−{pct(row.dropFromPrevious)}</span>}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: pct(row.fromStart) }} />
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      {retentions.map(({ step, retention }) => (
        <RetentionCard key={step.id} title={step.name} retention={retention} ctaAt={step.cta.showAt} />
      ))}

      <p className="text-xs text-muted-foreground">
        Compras vêm do webhook da Hotmart e são ligadas ao quiz pelo ID do produto da oferta. Eventos de visitantes da UE são medidos aqui mesmo sem consentimento, mas só vão à Meta com ele.
      </p>
    </div>
  );
}
