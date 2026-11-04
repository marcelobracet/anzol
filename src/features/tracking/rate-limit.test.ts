import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

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
