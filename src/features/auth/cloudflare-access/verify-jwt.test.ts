import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveDevBypass, verifyAccessJwt, type AccessConfig } from "./verify-jwt";

const TEAM = "https://anzol-team.cloudflareaccess.com";
const AUD = "aud-tag-0123456789abcdef";

let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;
let config: AccessConfig;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  const other = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  otherPrivateKey = other.privateKey;
  const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
  config = {
    teamDomain: TEAM,
    aud: AUD,
    allowedEmails: ["marcelo@example.com", "joao@example.com"],
    keys: createLocalJWKSet({ keys: [jwk] }),
  };
});

function sign(
  claims: Record<string, unknown> = {},
  opts: { key?: CryptoKey; iss?: string; aud?: string; exp?: string | number } = {},
) {
  return new SignJWT({ email: "Marcelo@Example.com", ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(opts.iss ?? TEAM)
    .setAudience(opts.aud ?? AUD)
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? "5m")
    .sign(opts.key ?? privateKey);
}

describe("verifyAccessJwt", () => {
  it("aceita token válido de e-mail permitido e normaliza o e-mail", async () => {
    const result = await verifyAccessJwt(await sign(), config);
    expect(result).toEqual({ ok: true, email: "marcelo@example.com" });
  });

  it("rejeita quando não há token", async () => {
    expect(await verifyAccessJwt(null, config)).toEqual({ ok: false, reason: "missing" });
    expect(await verifyAccessJwt("", config)).toEqual({ ok: false, reason: "missing" });
  });

  it("rejeita audience de outra aplicação", async () => {
    const result = await verifyAccessJwt(await sign({}, { aud: "outra-app" }), config);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejeita issuer de outro team", async () => {
    const result = await verifyAccessJwt(
      await sign({}, { iss: "https://outro.cloudflareaccess.com" }),
      config,
    );
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejeita token expirado", async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const result = await verifyAccessJwt(await sign({}, { exp: past }), config);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejeita assinatura de outra chave", async () => {
    const result = await verifyAccessJwt(await sign({}, { key: otherPrivateKey }), config);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejeita token não assinado (alg none)", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", kid: "k1" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ email: "marcelo@example.com", iss: TEAM, aud: AUD, exp: 9999999999 }),
    ).toString("base64url");
    const result = await verifyAccessJwt(`${header}.${payload}.`, config);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejeita lixo", async () => {
    expect(await verifyAccessJwt("nao.e.jwt", config)).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejeita e-mail fora da allowlist mesmo com token válido", async () => {
    const result = await verifyAccessJwt(await sign({ email: "intruso@example.com" }), config);
    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("rejeita token sem e-mail (service token)", async () => {
    const result = await verifyAccessJwt(await sign({ email: undefined }), config);
    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });
});

describe("resolveDevBypass", () => {
  it("nunca libera em produção na Vercel", () => {
    expect(
      resolveDevBypass({ vercelEnv: "production", nodeEnv: "production", email: "a@b.com" }),
    ).toBeNull();
  });

  it("nunca libera em build de produção fora da Vercel", () => {
    expect(
      resolveDevBypass({ vercelEnv: undefined, nodeEnv: "production", email: "a@b.com" }),
    ).toBeNull();
  });

  it("libera em preview e desenvolvimento quando configurado", () => {
    expect(
      resolveDevBypass({ vercelEnv: "preview", nodeEnv: "production", email: "A@b.com" }),
    ).toBe("a@b.com");
    expect(
      resolveDevBypass({ vercelEnv: undefined, nodeEnv: "development", email: "a@b.com" }),
    ).toBe("a@b.com");
  });

  it("não libera sem e-mail configurado", () => {
    expect(
      resolveDevBypass({ vercelEnv: undefined, nodeEnv: "development", email: undefined }),
    ).toBeNull();
  });
});
