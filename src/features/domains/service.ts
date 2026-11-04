import { normalizeHost } from "@/features/routing/resolve-route";
import type { Result } from "@/features/quiz/types";
import type { DomainRepository, QuizDomain } from "./repository";
import type { AddDomainResult, VercelDomains } from "./vercel-client";

export type DomainRouting = { studioHost: string; blockedHosts: readonly string[] };

function checkHost(raw: string, routing: DomainRouting): Result<string> {
  const host = normalizeHost(raw);
  if (!host || !host.includes(".")) return { success: false, error: "Domínio inválido" };
  if (host === routing.studioHost) return { success: false, error: "Esse é o domínio do Studio" };
  if (routing.blockedHosts.some((b) => host === b || host.endsWith(`.${b}`))) {
    return { success: false, error: "Domínio bloqueado para quizzes públicos" };
  }
  return { success: true, data: host };
}

export function createDomainService(repo: DomainRepository, vercel: VercelDomains, routing: DomainRouting) {
  return {
    listForQuiz(quizId: string): Promise<QuizDomain[]> {
      return repo.listForQuiz(quizId);
    },

    hostsForQuiz(quizId: string): Promise<string[]> {
      return repo.hostsForQuiz(quizId);
    },

    async add(quizId: string, rawHost: string, makeDefault: boolean): Promise<Result<AddDomainResult & { host: string }>> {
      const host = checkHost(rawHost, routing);
      if (!host.success) return host;
      let registered: AddDomainResult;
      try {
        registered = await vercel.add(host.data);
      } catch (error) {
        return { success: false, error: `Vercel: ${error instanceof Error ? error.message : "erro desconhecido"}` };
      }
      await repo.link(host.data, quizId, makeDefault);
      return { success: true, data: { host: host.data, ...registered } };
    },

    async remove(quizId: string, rawHost: string): Promise<Result<null>> {
      const host = normalizeHost(rawHost);
      if (!host) return { success: false, error: "Domínio inválido" };
      await repo.unlink(host, quizId);
      return { success: true, data: null };
    },
  };
}

export type DomainService = ReturnType<typeof createDomainService>;
