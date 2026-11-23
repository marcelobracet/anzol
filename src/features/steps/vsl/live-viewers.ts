import { z } from "zod";

// Contador "assistindo agora": oscila aos poucos ao redor de `base`, dentro de ± `spread`.
export const LiveViewers = z.object({
  enabled: z.boolean().default(false),
  base: z.number().int().min(1).max(100_000).default(120),
  spread: z.number().int().min(0).max(10_000).default(15),
});
export type LiveViewers = z.infer<typeof LiveViewers>;

export const MAX_STEP = 3; // maior variação por atualização
export const TICK_MIN_MS = 2500;
export const TICK_MAX_MS = 6000;

export function viewerRange({ base, spread }: LiveViewers): [number, number] {
  return [Math.max(1, base - spread), base + spread];
}

// Sorteia um alvo na faixa e anda no máximo MAX_STEP até ele.
export function nextViewers(current: number, config: LiveViewers, random: () => number = Math.random): number {
  const [min, max] = viewerRange(config);
  const from = Math.min(max, Math.max(min, Math.round(current)));
  if (from !== Math.round(current)) return from;
  const target = Math.round(min + random() * (max - min));
  const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, target - from));
  return from + step;
}

export function nextTickMs(random: () => number = Math.random): number {
  return Math.round(TICK_MIN_MS + random() * (TICK_MAX_MS - TICK_MIN_MS));
}
