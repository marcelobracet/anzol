import { describe, expect, it } from "vitest";
import { parseRecentQuery, toToastItems } from "./recent";

const NOW = new Date("2026-11-04T12:00:00Z");

describe("toToastItems", () => {
  it("expõe só primeiro nome, cidade, país e há quantos minutos", () => {
    const rows = [{ first_name: "Ana Maria", city: "Bogotá", country: "CO", created_at: "2026-11-04T11:55:00Z" }];
    expect(toToastItems(rows, NOW)).toEqual([{ firstName: "Ana", city: "Bogotá", country: "CO", minutesAgo: 5 }]);
  });

  it("descarta compras sem nome e linhas inválidas", () => {
    const rows = [
      { first_name: "  ", city: "X", country: null, created_at: "2026-11-04T11:00:00Z" },
      { first_name: null, city: null, country: null, created_at: "2026-11-04T11:00:00Z" },
      { foo: 1 },
      { first_name: "luis", city: null, country: null, created_at: "2026-11-04T10:00:00Z" },
    ];
    expect(toToastItems(rows, NOW)).toEqual([{ firstName: "Luis", city: undefined, country: undefined, minutesAgo: 120 }]);
  });

  it("limita a 10 itens", () => {
    const rows = Array.from({ length: 15 }, () => ({ first_name: "Ana", city: null, country: null, created_at: "2026-11-04T11:00:00Z" }));
    expect(toToastItems(rows, NOW)).toHaveLength(10);
  });
});

describe("parseRecentQuery", () => {
  it("lê slug e janela em horas", () => {
    expect(parseRecentQuery(new URLSearchParams("slug=meu-quiz&hours=24"))).toEqual({ slug: "meu-quiz", hours: 24 });
  });

  it("sem slug é o quiz padrão e janela padrão de 48h", () => {
    expect(parseRecentQuery(new URLSearchParams(""))).toEqual({ slug: null, hours: 48 });
  });

  it("rejeita slug inválido e janela fora de 1..168", () => {
    expect(parseRecentQuery(new URLSearchParams("slug=../x"))).toBeNull();
    expect(parseRecentQuery(new URLSearchParams("hours=500"))).toBeNull();
    expect(parseRecentQuery(new URLSearchParams("hours=abc"))).toBeNull();
  });
});
