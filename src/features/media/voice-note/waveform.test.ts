import { describe, expect, it } from "vitest";
import { BAR_COUNT, formatDuration, nextSpeed, waveformBars } from "./waveform";

describe("waveform do áudio", () => {
  it("é determinística por arquivo e muda entre arquivos", () => {
    expect(waveformBars("anzol/audio/a")).toEqual(waveformBars("anzol/audio/a"));
    expect(waveformBars("anzol/audio/a")).not.toEqual(waveformBars("anzol/audio/b"));
  });
  it("tem a quantidade certa de barras, entre 0.15 e 1, mais baixas nas pontas", () => {
    const bars = waveformBars("x");
    expect(bars).toHaveLength(BAR_COUNT);
    expect(Math.min(...bars)).toBeGreaterThanOrEqual(0.15);
    expect(Math.max(...bars)).toBeLessThanOrEqual(1);
    expect(bars[0]).toBeLessThanOrEqual(0.25);
  });
  it("formata a duração como no WhatsApp", () => {
    expect(formatDuration(7)).toBe("0:07");
    expect(formatDuration(75.9)).toBe("1:15");
    expect(formatDuration(-3)).toBe("0:00");
  });
  it("velocidade gira 1× → 1,5× → 2× → 1×", () => {
    expect([nextSpeed(1), nextSpeed(1.5), nextSpeed(2)]).toEqual([1.5, 2, 1]);
  });
});
