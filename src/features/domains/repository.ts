export type QuizDomain = { host: string; isDefault: boolean };

export interface DomainRepository {
  /** Cria o domínio se preciso e liga ao quiz; `makeDefault` torna o quiz a raiz do domínio. */
  link(host: string, quizId: string, makeDefault: boolean): Promise<void>;
  /** Desliga do quiz e limpa o padrão se era este quiz. */
  unlink(host: string, quizId: string): Promise<void>;
  listForQuiz(quizId: string): Promise<QuizDomain[]>;
  /** Hosts cujo cache do runtime pode conter este quiz. */
  hostsForQuiz(quizId: string): Promise<string[]>;
}
