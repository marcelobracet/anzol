import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { buildFunnel } from "@/features/dashboard/funnel";
import { parseFunnelQuery } from "@/features/dashboard/query";
import { loadFunnelStats } from "@/features/dashboard/stats";
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

  const stats = await loadFunnelStats(quiz.id, {
    versionId: query.scope === "current" ? version.id : null,
    from: query.from,
    to: query.to,
  });
  const funnel = buildFunnel(playableSteps(version.document), stats.counts, stats.purchases);
  const link = (patch: Partial<{ range: number; scope: string }>) =>
    `?${new URLSearchParams({ range: String(patch.range ?? query.days), scope: patch.scope ?? query.scope })}`;
  const chip = (active: boolean) => `rounded-md border px-2.5 py-1 text-sm ${active ? "bg-foreground text-background" : "bg-background hover:bg-muted"}`;

  const summary = [
    ["Visitantes", funnel.summary.visitors.toLocaleString("pt-BR")],
    ["Leads", funnel.summary.leads.toLocaleString("pt-BR")],
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
      <p className="text-xs text-muted-foreground">
        Compras vêm do webhook da Hotmart e são ligadas ao quiz pelo ID do produto da oferta. Eventos de visitantes da UE são medidos aqui mesmo sem consentimento, mas só vão à Meta com ele.
      </p>
    </div>
  );
}
