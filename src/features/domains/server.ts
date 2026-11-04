import "server-only";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { routingEnv, vercelApiEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createDomainService } from "./service";
import { createSupabaseDomainRepository } from "./supabase-repository";
import { createVercelDomains } from "./vercel-client";

export function domainService() {
  const routing = routingEnv();
  if (devMemoryEnabled()) {
    const fakeVercel = { add: async () => ({ verified: true, verification: [] }) };
    return createDomainService(devMemoryStore().domains, fakeVercel, {
      studioHost: routing.STUDIO_HOST,
      blockedHosts: routing.BLOCKED_HOSTS,
    });
  }
  const vercel = {
    // Credenciais lidas só ao cadastrar: listar domínios não exige token da Vercel.
    add: (host: string) => {
      const env = vercelApiEnv();
      return createVercelDomains({ token: env.VERCEL_API_TOKEN, projectId: env.VERCEL_PROJECT_ID, teamId: env.VERCEL_TEAM_ID }).add(host);
    },
  };
  return createDomainService(createSupabaseDomainRepository(supabaseAdmin()), vercel, {
    studioHost: routing.STUDIO_HOST,
    blockedHosts: routing.BLOCKED_HOSTS,
  });
}
