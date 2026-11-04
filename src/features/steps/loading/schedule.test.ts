import { describe, expect, it } from "vitest";
import { loadingSchedule, messageAt } from "./schedule";

const messages = [
  { text: "a", durationMs: 1000 },
  { text: "b", durationMs: 500 },
];

describe("loadingSchedule", () => {
  it("calcula início e fim acumulados e a duração total", () => {
    expect(loadingSchedule(messages)).toEqual({
      totalMs: 1500,
      slots: [
        { text: "a", startMs: 0, endMs: 1000 },
        { text: "b", startMs: 1000, endMs: 1500 },
      ],
    });
  });

  it("messageAt devolve a mensagem do instante, presa à última", () => {
    const schedule = loadingSchedule(messages);
    expect(messageAt(schedule, 0)).toBe(0);
    expect(messageAt(schedule, 999)).toBe(0);
    expect(messageAt(schedule, 1000)).toBe(1);
    expect(messageAt(schedule, 99_999)).toBe(1);
  });
});
