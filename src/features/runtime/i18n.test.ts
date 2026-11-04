import { describe, expect, it } from "vitest";
import { relativeTime, t } from "./i18n";

describe("t", () => {
  it("usa o idioma do locale", () => {
    expect(t("pt-BR", "continue")).toBe("Continuar");
    expect(t("es-MX", "continue")).toBe("Continuar");
    expect(t("en-GB", "continue")).toBe("Continue");
    expect(t("de-DE", "back")).toBe("Zurück");
  });

  it("interpola variáveis", () => {
    expect(t("es-CO", "justBought", { name: "Ana", city: "Bogotá" })).toBe("Ana, de Bogotá, acaba de comprar");
    expect(t("pt-BR", "justBoughtNoCity", { name: "Ana" })).toBe("Ana acabou de comprar");
  });

  it("idioma desconhecido cai no inglês", () => {
    expect(t("ja-JP", "continue")).toBe("Continue");
  });
});

describe("relativeTime", () => {
  it("formata minutos e horas no idioma", () => {
    expect(relativeTime(5, "pt-BR")).toMatch(/5/);
    expect(relativeTime(5, "pt-BR")).toMatch(/min/);
    expect(relativeTime(120, "es-MX")).toMatch(/2 horas/);
  });

  it("menos de um minuto é agora", () => {
    expect(relativeTime(0, "en-US")).toMatch(/now/);
  });
});
