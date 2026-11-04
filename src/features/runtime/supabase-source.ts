import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toPublishedQuiz, type PublishedQuizSource } from "./published-source";

export function createSupabaseSource(client: SupabaseClient): PublishedQuizSource {
  return {
    async find(host, slug) {
      const { data, error } = await client.rpc("published_quiz", { p_host: host, p_slug: slug }).maybeSingle();
      if (error) throw new Error(`Supabase published_quiz: ${error.message}`);
      return data ? toPublishedQuiz(data) : null;
    },
  };
}
