export type VercelConfig = { token: string; projectId: string; teamId?: string };
export type DomainVerification = { type: string; domain: string; value: string; reason?: string };
export type AddDomainResult = { verified: boolean; verification: DomainVerification[] };
export type VercelDomains = { add(host: string): Promise<AddDomainResult> };

const API = "https://api.vercel.com";

type DomainBody = { verified?: boolean; verification?: DomainVerification[]; error?: { message?: string } };

// Cadastra domínios de oferta no projeto da Vercel (o SSL é emitido por ela).
export function createVercelDomains(config: VercelConfig, fetchFn: typeof fetch = fetch): VercelDomains {
  const url = (path: string) => `${API}${path}${config.teamId ? `?teamId=${encodeURIComponent(config.teamId)}` : ""}`;
  const headers = { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" };
  const project = encodeURIComponent(config.projectId);
  const toResult = (body: DomainBody): AddDomainResult => ({
    verified: body.verified === true,
    verification: body.verification ?? [],
  });

  return {
    async add(host) {
      const response = await fetchFn(url(`/v10/projects/${project}/domains`), {
        method: "POST",
        headers,
        body: JSON.stringify({ name: host }),
      });
      const body = (await response.json()) as DomainBody;
      if (response.ok) return toResult(body);

      if (response.status === 409) {
        // Já existe: só é sucesso se estiver neste projeto.
        const existing = await fetchFn(url(`/v9/projects/${project}/domains/${encodeURIComponent(host)}`), { headers });
        if (existing.ok) return toResult((await existing.json()) as DomainBody);
      }
      throw new Error(body.error?.message ?? `HTTP ${response.status}`);
    },
  };
}
