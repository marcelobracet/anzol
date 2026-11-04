import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createDemoSource, DEMO_HOST, type PublishedQuiz } from "./published-source";
import { createRepositorySource } from "./repository-source";
import { runtimeTags } from "./runtime-tags";
import { createSupabaseSource } from "./supabase-source";

// O demo só existe em `next dev`; nunca em build de produção nem em previews.
const demoEnabled = () => process.env.NODE_ENV === "development" && process.env.VERCEL_ENV === undefined;

// Lê o snapshot publicado (nunca o rascunho). Cache por host/slug, invalidado por tag ao publicar.
export async function loadPublishedQuiz(host: string, slug: string | null): Promise<PublishedQuiz | null> {
  "use cache";
  cacheTag(runtimeTags.host(host));
  cacheLife("days");

  const source =
    host === DEMO_HOST && demoEnabled()
      ? createDemoSource()
      : devMemoryEnabled()
        ? createRepositorySource(devMemoryStore().quizzes, devMemoryStore().domains)
        : createSupabaseSource(supabaseAdmin());
  const quiz = await source.find(host, slug);
  if (quiz) cacheTag(runtimeTags.quiz(quiz.quizId));
  return quiz;
}
