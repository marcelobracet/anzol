import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { LeadKpiCards } from "@/features/dashboard/components/lead-kpi-cards";
import { LeadsTable } from "@/features/dashboard/components/leads-table";
import { kpiThresholds } from "@/features/dashboard/leads";
import { LEADS_PAGE_SIZE, loadLeads } from "@/features/dashboard/leads-data";
import { parseLeadsQuery, type LeadsQuery } from "@/features/dashboard/query";
import { quizService } from "@/features/quiz/server";
import { playableSteps } from "@/features/runtime/engine";

// Dados privados e sempre frescos.
export const instant = false;

const chip = (active: boolean) => `rounded-md border px-2.5 py-1 text-sm ${active ? "bg-foreground text-background" : "bg-background hover:bg-muted"}`;

export default async function LeadsPage({ params, searchParams }: PageProps<"/studio/quizzes/[id]/leads">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();

  await connection(); // "agora" é da requisição, não do prerender
  const query = parseLeadsQuery(await searchParams, new Date());
  const version = quiz.publishedVersionId ? await quizService().findVersion(quiz.publishedVersionId) : null;

  const header = (
    <div>
      <Link href={`/quizzes/${quiz.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao editor</Link>
      <div className="mt-2 flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">Leads · {quiz.name}</h1>
        <Link href={`/quizzes/${quiz.id}/funnel`} className="text-sm text-muted-foreground hover:text-foreground">Ver funil →</Link>
      </div>
    </div>
  );

  if (!version) {
    return (
      <div className="grid gap-6 px-6 py-8">
        {header}
        <p className="text-sm text-muted-foreground">Publique o quiz para começar a receber leads.</p>
      </div>
    );
  }

  const steps = playableSteps(version.document);
  const data = await loadLeads(quiz.id, steps, {
    versionId: query.scope === "current" ? version.id : null,
    from: query.from,
    to: query.to,
    q: query.q,
    page: query.page,
  });
  const pages = Math.max(1, Math.ceil(data.total / LEADS_PAGE_SIZE));
  const link = (patch: Partial<Pick<LeadsQuery, "days" | "scope" | "page">>) => {
    const next = new URLSearchParams({ range: String(patch.days ?? query.days), scope: patch.scope ?? query.scope });
    if (query.q) next.set("q", query.q);
    if ((patch.page ?? 1) > 1) next.set("page", String(patch.page));
    return `?${next}`;
  };

  return (
    <div className="grid gap-6 px-6 py-8">
      {header}
      <div className="flex flex-wrap items-center gap-2">
        {([7, 30, 90] as const).map((d) => (
          <Link key={d} href={link({ days: d })} className={chip(query.days === d)}>{d} dias</Link>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        <Link href={link({ scope: "current" })} className={chip(query.scope === "current")}>Versão {version.versionNumber}</Link>
        <Link href={link({ scope: "all" })} className={chip(query.scope === "all")}>Todas as versões</Link>
      </div>

      <LeadKpiCards kpis={data.kpis} qualifiedMin={kpiThresholds(steps).qualifiedMin} />

      <form className="flex max-w-xl gap-2" action="">
        <input type="hidden" name="range" value={query.days} />
        <input type="hidden" name="scope" value={query.scope} />
        <Input name="q" defaultValue={query.q ?? ""} placeholder="Buscar por resposta, nome, e-mail ou telefone" maxLength={100} />
        <Button type="submit" variant="outline">Buscar</Button>
        {query.q && <Link href={link({})} className="self-center text-sm text-muted-foreground hover:text-foreground">Limpar</Link>}
      </form>

      {data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{query.q ? "Nenhuma sessão encontrada para essa busca." : "Nenhuma sessão nesse período."}</p>
      ) : (
        <LeadsTable steps={steps} rows={data.rows} />
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{data.total.toLocaleString("pt-BR")} sessões{query.q ? " encontradas" : ""}</span>
        {pages > 1 && (
          <span className="flex items-center gap-3">
            {query.page > 1 && <Link href={link({ page: query.page - 1 })} className="hover:text-foreground">← Anterior</Link>}
            <span>Página {query.page} de {pages}</span>
            {query.page < pages && <Link href={link({ page: query.page + 1 })} className="hover:text-foreground">Próxima →</Link>}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Cada linha é uma sessão (um visitante num navegador). Mostra a última resposta de cada pergunta; &quot;visto&quot; marca etapas sem resposta que a pessoa viu.
        Respostas passaram a ser gravadas a partir desta versão do Anzol; sessões anteriores mostram só as etapas vistas.
      </p>
    </div>
  );
}
