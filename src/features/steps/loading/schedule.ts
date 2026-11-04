import type { LoadingStep } from "./schema";

export type LoadingSchedule = {
  totalMs: number;
  slots: { text: string; startMs: number; endMs: number }[];
};

export function loadingSchedule(messages: LoadingStep["messages"]): LoadingSchedule {
  const slots = messages.reduce<LoadingSchedule["slots"]>((acc, message) => {
    const startMs = acc.at(-1)?.endMs ?? 0;
    return [...acc, { text: message.text, startMs, endMs: startMs + message.durationMs }];
  }, []);
  return { totalMs: slots.at(-1)?.endMs ?? 0, slots };
}

export function messageAt(schedule: LoadingSchedule, elapsedMs: number): number {
  const index = schedule.slots.findIndex((slot) => elapsedMs < slot.endMs);
  return index === -1 ? schedule.slots.length - 1 : index;
}
