import { describe, expect, it } from "vitest";
import { normalizeDuration } from "./audio-duration";

describe("normalizeDuration", () => {
  it("arredonda para décimos", () => {
    expect(normalizeDuration(25.37)).toBe(25.4);
  });
  it("recusa duração ilegível (Infinity/NaN) e acima de 10 min", () => {
    expect(() => normalizeDuration(Infinity)).toThrow();
    expect(() => normalizeDuration(Number.NaN)).toThrow();
    expect(() => normalizeDuration(601)).toThrow();
  });
});
