import { describe, expect, it } from "vitest";
import { parseFunnelQuery } from "./query";

const NOW = new Date("2026-11-04T12:00:00Z");

describe("parseFunnelQuery", () => {
  it("padrão: últimos 7 dias, versão atual", () => {
    expect(parseFunnelQuery({}, NOW)).toEqual({ days: 7, scope: "current", from: "2026-10-28T12:00:00.000Z", to: "2026-11-04T12:00:00.000Z" });
  });

  it("aceita 30 e 90 dias e todas as versões", () => {
    expect(parseFunnelQuery({ range: "30", scope: "all" }, NOW)).toMatchObject({ days: 30, scope: "all", from: "2026-10-05T12:00:00.000Z" });
  });

  it("valor desconhecido cai no padrão", () => {
    expect(parseFunnelQuery({ range: "9999", scope: ["x"] }, NOW)).toMatchObject({ days: 7, scope: "current" });
  });
});
