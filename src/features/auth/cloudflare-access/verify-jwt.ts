import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

export type AccessConfig = {
  teamDomain: string;
  aud: string;
  allowedEmails: readonly string[];
  keys: JWTVerifyGetKey;
};

export type AccessResult =
  | { ok: true; email: string }
  | { ok: false; reason: "missing" | "invalid" | "forbidden" };

const remoteKeySets = new Map<string, JWTVerifyGetKey>();

// jose guarda as chaves em cache e refaz o fetch quando aparece um `kid` novo (rotação do Cloudflare).
export function cloudflareKeys(teamDomain: string): JWTVerifyGetKey {
  const cached = remoteKeySets.get(teamDomain);
  if (cached) return cached;
  const keys = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", teamDomain));
  remoteKeySets.set(teamDomain, keys);
  return keys;
}

export async function verifyAccessJwt(
  token: string | null | undefined,
  config: AccessConfig,
): Promise<AccessResult> {
  if (!token) return { ok: false, reason: "missing" };

  let email: unknown;
  try {
    const { payload } = await jwtVerify(token, config.keys, {
      issuer: config.teamDomain,
      audience: config.aud,
      algorithms: ["RS256"],
    });
    email = payload.email;
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (typeof email !== "string") return { ok: false, reason: "forbidden" };
  const normalized = email.trim().toLowerCase();
  if (!config.allowedEmails.includes(normalized)) return { ok: false, reason: "forbidden" };
  return { ok: true, email: normalized };
}

type BypassInput = {
  vercelEnv: string | undefined;
  nodeEnv: string | undefined;
  email: string | undefined;
};

// Localhost e previews não passam pelo Cloudflare Access. Produção nunca aceita bypass.
export function resolveDevBypass({ vercelEnv, nodeEnv, email }: BypassInput): string | null {
  if (!email) return null;
  if (vercelEnv === "production") return null;
  const allowed = vercelEnv === "preview" || (vercelEnv === undefined && nodeEnv === "development");
  return allowed ? email.trim().toLowerCase() : null;
}
