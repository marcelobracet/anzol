import { authEnv } from "@/lib/env";
import {
  ACCESS_JWT_HEADER,
  cloudflareKeys,
  resolveDevBypass,
  verifyAccessJwt,
  type AccessResult,
} from "./cloudflare-access/verify-jwt";

// Usado pelo proxy e de novo dentro de cada página/server action do Studio (defesa em profundidade).
export async function authenticateStudio(headers: Headers): Promise<AccessResult> {
  const bypass = resolveDevBypass({
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    email: process.env.AUTH_DEV_BYPASS_EMAIL,
  });
  if (bypass) return { ok: true, email: bypass };

  const env = authEnv();
  return verifyAccessJwt(headers.get(ACCESS_JWT_HEADER), {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    aud: env.CF_ACCESS_AUD,
    allowedEmails: env.STUDIO_ALLOWED_EMAILS,
    keys: cloudflareKeys(env.CF_ACCESS_TEAM_DOMAIN),
  });
}
