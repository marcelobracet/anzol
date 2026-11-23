import { describe, expect, it } from "vitest";
import { MAX_STEP, nextViewers, viewerRange } from "./live-viewers";
import { VslStep } from "./schema";

const cfg = { enabled: true, base: 88, spread: 10 };

describe("viewerRange", () => {
  it("vai de base - spread a base + spread", () => {
    expect(viewerRange(cfg)).toEqual([78, 98]);
  });

  it("nunca mostra menos de 1 pessoa", () => {
    expect(viewerRange({ enabled: true, base: 3, spread: 10 })).toEqual([1, 13]);
  });
});

describe("nextViewers", () => {
  it("anda no máximo MAX_STEP por vez rumo a um alvo dentro da faixa", () => {
    expect(nextViewers(88, cfg, () => 1)).toBe(88 + MAX_STEP);
    expect(nextViewers(88, cfg, () => 0)).toBe(88 - MAX_STEP);
  });

  it("chega no alvo sem passar dele", () => {
    // random 0.5 => alvo = base
    expect(nextViewers(89, cfg, () => 0.5)).toBe(88);
  });

  it("fica sempre dentro da faixa e muda aos poucos", () => {
    let current = cfg.base;
    for (let i = 0; i < 2000; i++) {
      const next = nextViewers(current, cfg);
      expect(Math.abs(next - current)).toBeLessThanOrEqual(MAX_STEP);
      expect(next).toBeGreaterThanOrEqual(78);
      expect(next).toBeLessThanOrEqual(98);
      expect(Number.isInteger(next)).toBe(true);
      current = next;
    }
  });

  it("volta para a faixa se a base mudou no editor", () => {
    expect(nextViewers(500, cfg, () => 0.5)).toBe(98);
  });

  it("sem variação fica parado na base", () => {
    expect(nextViewers(88, { ...cfg, spread: 0 }, () => 1)).toBe(88);
  });
});

describe("schema liveViewers", () => {
  const base = {
    id: "vsl1",
    name: "VSL",
    type: "vsl",
    cta: { label: "Comprar", showAt: 60, offerId: "off1" },
  };

  it("vem desligado por padrão", () => {
    const parsed = VslStep.safeParse(base);
    expect(parsed.success && parsed.data.liveViewers.enabled).toBe(false);
  });

  it("rejeita base menor que 1", () => {
    expect(VslStep.safeParse({ ...base, liveViewers: { enabled: true, base: 0, spread: 5 } }).success).toBe(false);
  });
});
