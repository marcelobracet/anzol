import { describe, expect, it } from "vitest";
import { parseRuntimePath } from "./runtime-path";

describe("parseRuntimePath", () => {
  it("raiz do domínio usa o quiz padrão", () => {
    expect(parseRuntimePath("oferta.com", undefined)).toEqual({ host: "oferta.com", slug: null });
    expect(parseRuntimePath("oferta.com", [])).toEqual({ host: "oferta.com", slug: null });
  });

  it("um segmento é o slug do quiz", () => {
    expect(parseRuntimePath("oferta.com", ["meu-quiz"])).toEqual({ host: "oferta.com", slug: "meu-quiz" });
  });

  it("decodifica o host vindo do segmento", () => {
    expect(parseRuntimePath("demo.localhost%3A3000", undefined)).toEqual({ host: "demo.localhost", slug: null });
  });

  it("rejeita mais de um segmento, slug inválido e host inválido", () => {
    expect(parseRuntimePath("oferta.com", ["a", "b"])).toBeNull();
    expect(parseRuntimePath("oferta.com", ["Meu_Quiz"])).toBeNull();
    expect(parseRuntimePath("_shell", undefined)).toBeNull();
  });
});
