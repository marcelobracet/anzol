import { NextResponse, type NextRequest } from "next/server";
import { loadRecentPurchaseRows } from "@/features/purchases/load-recent";
import { parseRecentQuery, toToastItems } from "@/features/purchases/recent";
import { normalizeHost } from "@/features/routing/resolve-route";
import { loadPublishedQuiz } from "@/features/runtime/load-published";

const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status });

// Toast da VSL: só compras reais do quiz publicado neste domínio.
export async function GET(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"));
  const query = parseRecentQuery(request.nextUrl.searchParams);
  if (!host || !query) return fail(400, "Parâmetros inválidos");

  const quiz = await loadPublishedQuiz(host, query.slug);
  if (!quiz) return fail(404, "Quiz não encontrado");

  try {
    const rows = await loadRecentPurchaseRows(quiz.quizId, query.hours);
    return NextResponse.json(
      { success: true, data: toToastItems(rows, new Date()) },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  } catch (error) {
    console.error("[purchases] falha ao carregar compras recentes", { quizId: quiz.quizId, error });
    return fail(500, "Indisponível");
  }
}
