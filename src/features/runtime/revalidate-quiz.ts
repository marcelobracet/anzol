import "server-only";
import { revalidateTag } from "next/cache";
import { domainService } from "@/features/domains/server";
import { runtimeTags } from "./runtime-tags";

// Publicar ou fazer rollback troca o snapshot: expire 0 para o próximo visitante já ver a versão certa.
export async function revalidateQuizRuntime(quizId: string): Promise<void> {
  const hosts = await domainService().hostsForQuiz(quizId);
  for (const tag of [runtimeTags.quiz(quizId), ...hosts.map(runtimeTags.host)]) revalidateTag(tag, { expire: 0 });
}
