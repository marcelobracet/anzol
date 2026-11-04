import type { DomainRepository } from "./repository";

// Implementação para testes. Mesmo contrato da versão Supabase.
export function createInMemoryDomainRepository(): DomainRepository {
  let defaults: Record<string, string | null> = {};
  let links: { host: string; quizId: string }[] = [];

  return {
    async link(host, quizId, makeDefault) {
      defaults = { ...defaults, [host]: makeDefault ? quizId : (defaults[host] ?? null) };
      if (!links.some((l) => l.host === host && l.quizId === quizId)) links = [...links, { host, quizId }];
    },
    async unlink(host, quizId) {
      links = links.filter((l) => !(l.host === host && l.quizId === quizId));
      if (defaults[host] === quizId) defaults = { ...defaults, [host]: null };
    },
    async listForQuiz(quizId) {
      return links
        .filter((l) => l.quizId === quizId)
        .map(({ host }) => ({ host, isDefault: defaults[host] === quizId }));
    },
    async hostsForQuiz(quizId) {
      const hosts = [
        ...links.filter((l) => l.quizId === quizId).map((l) => l.host),
        ...Object.keys(defaults).filter((h) => defaults[h] === quizId),
      ];
      return [...new Set(hosts)];
    },
  };
}
