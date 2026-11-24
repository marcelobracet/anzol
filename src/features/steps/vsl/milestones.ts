// Grade de marcos de retenção: 5s no 1º minuto, 10s até 5 min, 30s depois.
// Mais fina no começo, onde a maioria sai, e com poucos eventos por minuto.
const BANDS = [
  { until: 60, step: 5 },
  { until: 300, step: 10 },
  { until: Number.POSITIVE_INFINITY, step: 30 },
] as const;

export const MAX_VIDEO_SECOND = 6 * 3600;

function bandOf(seconds: number) {
  return BANDS.find((b) => seconds < b.until) ?? BANDS[BANDS.length - 1];
}

// `extra`: pontos fora da grade que também viram marco. Hoje, o segundo em que o botão (CTA) aparece:
// sem ele, quem vê o botão e sai antes do próximo marco da grade fica gravado como se não tivesse chegado lá.
export function milestoneAt(seconds: number, extra: readonly number[] = []): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const { step } = bandOf(seconds);
  const grid = Math.floor(seconds / step) * step;
  return Math.max(grid, ...extrasOf(extra).filter((e) => e <= seconds));
}

const extrasOf = (extra: readonly number[]): number[] => extra.filter((e) => Number.isInteger(e) && e >= 0);

/** Ponto da grade. Um parâmetro só, para servir de callback (`[...].every(isMilestone)`). */
export function isMilestone(seconds: number): boolean {
  return isMilestoneWith(seconds, []);
}

/** Ponto da grade ou um dos pontos extras (ex.: o segundo do CTA do step). */
export function isMilestoneWith(seconds: number, extra: readonly number[]): boolean {
  return Number.isInteger(seconds) && seconds >= 0 && seconds <= MAX_VIDEO_SECOND && milestoneAt(seconds, extra) === seconds;
}

/** Marco a enviar agora, ou null se ainda não passou do último enviado. */
export function nextMilestone(lastSent: number | null, currentTime: number, extra: readonly number[] = []): number | null {
  const milestone = milestoneAt(currentTime, extra);
  return lastSent === null || milestone > lastSent ? milestone : null;
}

/** Todos os marcos de 0 até `last` (inclusive), na ordem, com os pontos extras. */
export function milestonesUpTo(last: number, extra: readonly number[] = []): number[] {
  const points: number[] = [];
  for (let s = 0; s <= last; s += bandOf(s).step) points.push(s);
  const extras = extrasOf(extra).filter((e) => e <= last && !points.includes(e));
  return [...points, ...extras].sort((a, b) => a - b);
}
