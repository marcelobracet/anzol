import { describe, expect, it } from "vitest";
import { ctaVisible, displayedProgress, toastWindowOpen } from "./progress";

describe("displayedProgress", () => {
  it("aplica 1 - (1 - x)^k", () => {
    expect(displayedProgress(0, 100, 3)).toBe(0);
    expect(displayedProgress(50, 100, 3)).toBeCloseTo(0.875);
    expect(displayedProgress(100, 100, 3)).toBe(1);
  });

  it("k = 1 é linear", () => {
    expect(displayedProgress(25, 100, 1)).toBeCloseTo(0.25);
  });

  it("anda mais rápido no começo que o tempo real", () => {
    expect(displayedProgress(10, 100, 3)).toBeGreaterThan(0.1);
  });

  it("duração desconhecida ou tempo fora da faixa ficam presos em [0, 1]", () => {
    expect(displayedProgress(10, 0, 3)).toBe(0);
    expect(displayedProgress(10, Number.NaN, 3)).toBe(0);
    expect(displayedProgress(200, 100, 3)).toBe(1);
    expect(displayedProgress(-5, 100, 3)).toBe(0);
  });
});

describe("ctaVisible", () => {
  it("aparece quando o tempo assistido chega em showAt", () => {
    expect(ctaVisible(599, 600)).toBe(false);
    expect(ctaVisible(600, 600)).toBe(true);
  });

  it("showAt 0 mostra desde o início", () => {
    expect(ctaVisible(0, 0)).toBe(true);
  });
});

describe("toastWindowOpen", () => {
  const toast = { enabled: true, leadSeconds: 30, windowHours: 48 };

  it("abre leadSeconds antes do CTA", () => {
    expect(toastWindowOpen(569, 600, toast)).toBe(false);
    expect(toastWindowOpen(570, 600, toast)).toBe(true);
  });

  it("desligado nunca abre", () => {
    expect(toastWindowOpen(9999, 600, { ...toast, enabled: false })).toBe(false);
  });
});
