// Tags de cache do runtime. Publicar um quiz ou mudar domínios invalida estas tags.
export const runtimeTags = {
  host: (host: string) => `runtime:host:${host}`,
  quiz: (quizId: string) => `runtime:quiz:${quizId}`,
};
