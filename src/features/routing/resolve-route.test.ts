import { describe, expect, it } from "vitest";
import { normalizeHost, resolveRoute, type RoutingConfig } from "./resolve-route";

const config: RoutingConfig = {
  studioHost: "anzol.marcelobracet.com.br",
  blockedHosts: ["marcelobracet.com.br", "www.marcelobracet.com.br"],
};

const route = (host: string | null, pathname: string) => resolveRoute({ host, pathname }, config);

describe("normalizeHost", () => {
  it("remove porta, ponto final e caixa alta", () => {
    expect(normalizeHost("Oferta.Example.com:443")).toBe("oferta.example.com");
    expect(normalizeHost("oferta.example.com.")).toBe("oferta.example.com");
  });

  it("rejeita host vazio ou com caracteres inválidos", () => {
    expect(normalizeHost(null)).toBeNull();
    expect(normalizeHost("")).toBeNull();
    expect(normalizeHost("evil.com/../x")).toBeNull();
    expect(normalizeHost("a b.com")).toBeNull();
  });
});

describe("resolveRoute — Studio", () => {
  it("raiz do Studio vai para /studio com auth", () => {
    expect(route("anzol.marcelobracet.com.br", "/")).toEqual({
      kind: "studio",
      rewrite: "/studio",
    });
  });

  it("URLs limpas do Studio são reescritas para /studio", () => {
    expect(route("anzol.marcelobracet.com.br", "/quizzes/abc")).toEqual({
      kind: "studio",
      rewrite: "/studio/quizzes/abc",
    });
  });

  it("API do Studio exige auth sem rewrite", () => {
    expect(route("anzol.marcelobracet.com.br", "/api/studio/uploads")).toEqual({
      kind: "studio",
      rewrite: null,
    });
  });

  it("webhooks no host do Studio passam sem JWT (auth própria)", () => {
    expect(route("anzol.marcelobracet.com.br", "/api/webhooks/hotmart")).toEqual({
      kind: "webhook",
    });
  });

  it("Studio não serve runtime interno nem outras APIs", () => {
    expect(route("anzol.marcelobracet.com.br", "/r/x.com")).toEqual({ kind: "not-found" });
    expect(route("anzol.marcelobracet.com.br", "/api/t")).toEqual({ kind: "not-found" });
  });

  it("aceita o host do Studio com porta", () => {
    expect(route("anzol.marcelobracet.com.br:443", "/")).toMatchObject({ kind: "studio" });
  });
});

describe("resolveRoute — domínio pessoal", () => {
  it("marcelobracet.com.br nunca serve nada", () => {
    expect(route("marcelobracet.com.br", "/")).toEqual({ kind: "not-found" });
    expect(route("www.marcelobracet.com.br", "/quiz")).toEqual({ kind: "not-found" });
  });

  it("outros subdomínios do domínio pessoal também não servem quiz", () => {
    expect(route("qualquer.marcelobracet.com.br", "/")).toEqual({ kind: "not-found" });
  });
});

describe("resolveRoute — Runtime", () => {
  it("reescreve domínio de oferta para /r/[host]", () => {
    expect(route("oferta.com", "/")).toEqual({ kind: "runtime", rewrite: "/r/oferta.com" });
    expect(route("Oferta.com", "/quiz-b")).toEqual({
      kind: "runtime",
      rewrite: "/r/oferta.com/quiz-b",
    });
  });

  it("API pública de eventos passa no domínio da oferta", () => {
    expect(route("oferta.com", "/api/t")).toEqual({ kind: "runtime-api" });
  });

  it("domínio de oferta nunca expõe Studio, webhooks ou rotas internas", () => {
    for (const path of ["/studio", "/studio/quizzes", "/api/studio/x", "/api/webhooks/hotmart", "/r/outro.com"]) {
      expect(route("oferta.com", path)).toEqual({ kind: "not-found" });
    }
  });

  it("host inválido é 404", () => {
    expect(route(null, "/")).toEqual({ kind: "not-found" });
  });
});
