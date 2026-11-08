import { describe, expect, it } from "vitest";
import { formatDuration, parseDuration } from "./duration";

describe("parseDuration", () => {
  it("aceita segundos com ou sem s", () => {
    expect(parseDuration("300")).toBe(300);
    expect(parseDuration("300s")).toBe(300);
  });

  it("aceita minutos e segundos", () => {
    expect(parseDuration("2m30s")).toBe(150);
    expect(parseDuration("2m 30s")).toBe(150);
    expect(parseDuration("5m")).toBe(300);
    expect(parseDuration("1h2m3s")).toBe(3723);
  });

  it("aceita mm:ss e hh:mm:ss", () => {
    expect(parseDuration("2:30")).toBe(150);
    expect(parseDuration("1:02:03")).toBe(3723);
  });

  it("ignora maiúsculas e espaços nas pontas", () => {
    expect(parseDuration("  10M ")).toBe(600);
  });

  it("devolve null para o que não entende", () => {
    for (const input of ["", "abc", "2x", "1:75", "-5", "2m30", "s"]) {
      expect(parseDuration(input), input).toBeNull();
    }
  });
});

describe("formatDuration", () => {
  it("usa a forma mais curta", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(150)).toBe("2m30s");
    expect(formatDuration(600)).toBe("10m");
    expect(formatDuration(3723)).toBe("1h2m3s");
  });

  it("volta ao mesmo valor ao reler", () => {
    for (const seconds of [0, 1, 59, 60, 61, 599, 3600, 7322]) {
      expect(parseDuration(formatDuration(seconds))).toBe(seconds);
    }
  });
});
