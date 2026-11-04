import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { DomainRepository } from "./repository";

function check(error: PostgrestError | null): void {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export function createSupabaseDomainRepository(db: SupabaseClient): DomainRepository {
  return {
    async link(host, quizId, makeDefault) {
      const domains = db.from("domains");
      const upsert = makeDefault
        ? domains.upsert({ host, default_quiz_id: quizId }, { onConflict: "host" })
        : domains.upsert({ host }, { onConflict: "host", ignoreDuplicates: true });
      check((await upsert).error);
      check(
        (await db.from("quiz_domains").upsert({ host, quiz_id: quizId }, { onConflict: "quiz_id,host", ignoreDuplicates: true }))
          .error,
      );
    },

    async unlink(host, quizId) {
      check((await db.from("quiz_domains").delete().eq("host", host).eq("quiz_id", quizId)).error);
      check((await db.from("domains").update({ default_quiz_id: null }).eq("host", host).eq("default_quiz_id", quizId)).error);
    },

    async listForQuiz(quizId) {
      const { data, error } = await db
        .from("quiz_domains")
        .select("host, domains(default_quiz_id)")
        .eq("quiz_id", quizId)
        .order("host");
      check(error);
      return (data ?? []).map((row) => {
        const domain = row.domains as { default_quiz_id: string | null } | { default_quiz_id: string | null }[] | null;
        const defaultQuizId = Array.isArray(domain) ? domain[0]?.default_quiz_id : domain?.default_quiz_id;
        return { host: row.host as string, isDefault: defaultQuizId === quizId };
      });
    },

    async hostsForQuiz(quizId) {
      const [linked, defaults] = await Promise.all([
        db.from("quiz_domains").select("host").eq("quiz_id", quizId),
        db.from("domains").select("host").eq("default_quiz_id", quizId),
      ]);
      check(linked.error);
      check(defaults.error);
      return [...new Set([...(linked.data ?? []), ...(defaults.data ?? [])].map((row) => row.host as string))];
    },
  };
}
