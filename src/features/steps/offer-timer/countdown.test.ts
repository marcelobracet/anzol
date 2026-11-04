import { describe, expect, it } from "vitest";
import { countdown } from "./countdown";

const NOW = new Date("2026-11-04T12:00:00Z");

describe("countdown", () => {
  it("quebra o tempo restante em dias, horas, minutos e segundos", () => {
    expect(countdown("2026-11-05T13:02:03Z", NOW)).toEqual({ expired: false, days: 1, hours: 1, minutes: 2, seconds: 3 });
  });

  it("respeita o fuso do ISO", () => {
    expect(countdown("2026-11-04T10:00:30-02:00", NOW)).toEqual({ expired: false, days: 0, hours: 0, minutes: 0, seconds: 30 });
  });

  it("data passada ou agora está expirada", () => {
    expect(countdown("2026-11-04T12:00:00Z", NOW).expired).toBe(true);
    expect(countdown("2020-01-01T00:00:00Z", NOW)).toEqual({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("sem data é expirado", () => {
    expect(countdown(undefined, NOW).expired).toBe(true);
  });
});
