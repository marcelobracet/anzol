import { describe, expect, it } from "vitest";
import { createRateLimiter, createTrackLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("permite até o limite por janela e por chave", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => now });
    expect([limiter.allow("a"), limiter.allow("a"), limiter.allow("a")]).toEqual([true, true, false]);
    expect(limiter.allow("b")).toBe(true);
    now = 1000;
    expect(limiter.allow("a")).toBe(true);
  });

  it("não cresce sem limite: descarta janelas vencidas", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 10, now: () => now, maxKeys: 3 });
    for (const key of ["a", "b", "c", "d", "e"]) limiter.allow(key);
    expect(limiter.size()).toBeLessThanOrEqual(3);
    now = 100;
    limiter.allow("z");
    expect(limiter.size()).toBe(1);
  });
});

describe("createTrackLimiter", () => {
  // Operadora móvel com CGNAT: muita gente no mesmo IP assistindo o vídeo ao mesmo tempo.
  it("progresso do vídeo tem cota própria e não tira a vez de lead/checkout", () => {
    const limiter = createTrackLimiter({ eventsPerMinute: 2, progressPerMinute: 5, now: () => 0 });
    const progress = Array.from({ length: 6 }, () => limiter.allow("1.1.1.1", "vsl_progress"));
    expect(progress).toEqual([true, true, true, true, true, false]);
    expect([limiter.allow("1.1.1.1", "checkout_click"), limiter.allow("1.1.1.1", "lead"), limiter.allow("1.1.1.1", "lead")]).toEqual([true, true, false]);
  });

  it("tipo desconhecido usa a cota geral", () => {
    const limiter = createTrackLimiter({ eventsPerMinute: 1, progressPerMinute: 10, now: () => 0 });
    expect([limiter.allow("ip", undefined), limiter.allow("ip", "step_view")]).toEqual([true, false]);
  });
});
