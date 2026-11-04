import "server-only";
import { notFound } from "next/navigation";
import { loadPublishedQuiz } from "@/features/runtime/load-published";
import { parseRuntimePath } from "@/features/runtime/runtime-path";

export async function quizFromParams(params: Promise<{ host: string; slug?: string[] }>) {
  const { host, slug } = await params;
  const path = parseRuntimePath(host, slug);
  if (!path) notFound();
  const quiz = await loadPublishedQuiz(path.host, path.slug);
  if (!quiz) notFound();
  return quiz;
}
