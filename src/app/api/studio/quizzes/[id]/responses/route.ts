import { z } from "zod";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { responsesCsv } from "@/features/dashboard/csv";
import { parseFunnelQuery } from "@/features/dashboard/query";
import { loadResponses, type ResponseRow } from "@/features/dashboard/responses";
import { quizService } from "@/features/quiz/server";
import { playableSteps } from "@/features/runtime/engine";

const BATCH = 500;
const MAX_ROWS = 10_000;

// CSV das respostas (Studio, atrás do Cloudflare Access). Mesmos filtros da página de respostas.
export async function GET(request: Request, { params }: RouteContext<"/api/studio/quizzes/[id]/responses">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const quiz = await quizService().findById(id);
  const version = quiz?.publishedVersionId ? await quizService().findVersion(quiz.publishedVersionId) : null;
  if (!quiz || !version) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const query = parseFunnelQuery(Object.fromEntries(url.searchParams), new Date());
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const filter = { versionId: query.scope === "current" ? version.id : null, from: query.from, to: query.to };

  const rows: ResponseRow[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += BATCH) {
    const page = await loadResponses(quiz.id, filter, { search, limit: BATCH, offset });
    rows.push(...page.rows);
    if (page.rows.length < BATCH) break;
  }

  const csv = responsesCsv(playableSteps(version.document), rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="respostas-${quiz.slug}-${query.days}d.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
