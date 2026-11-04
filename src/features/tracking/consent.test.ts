import { describe, expect, it } from "vitest";
import { consentRequired, isEuCountry, isEuLocale } from "./consent";

describe("consentRequired", () => {
  it("locale europeu sempre exige", () => {
    for (const locale of ["pt-PT", "es-ES", "de-DE", "fr-FR", "it-IT", "en-GB"]) {
      expect(isEuLocale(locale)).toBe(true);
      expect(consentRequired({ locale, country: "MX" })).toBe(true);
    }
  });

  it("locale de fora exige quando o IP é do EEE, Reino Unido ou Suíça", () => {
    expect(consentRequired({ locale: "es-MX", country: "ES" })).toBe(true);
    expect(consentRequired({ locale: "pt-BR", country: "gb" })).toBe(true);
    expect(consentRequired({ locale: "es-CO", country: "CH" })).toBe(true);
    expect(consentRequired({ locale: "es-CO", country: "NO" })).toBe(true);
  });

  it("locale de fora com IP de fora não exige", () => {
    expect(consentRequired({ locale: "es-MX", country: "MX" })).toBe(false);
    expect(consentRequired({ locale: "pt-BR", country: "BR" })).toBe(false);
  });

  it("país desconhecido segue só o locale", () => {
    expect(consentRequired({ locale: "es-MX", country: null })).toBe(false);
    expect(isEuCountry("XX")).toBe(false);
  });
});
