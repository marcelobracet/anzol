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

export function milestoneAt(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const { step } = bandOf(seconds);
  return Math.floor(seconds / step) * step;
}

export function isMilestone(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds >= 0 && seconds <= MAX_VIDEO_SECOND && milestoneAt(seconds) === seconds;
}

/** Marco a enviar agora, ou null se ainda não passou do último enviado. */
export function nextMilestone(lastSent: number | null, currentTime: number): number | null {
  const milestone = milestoneAt(currentTime);
  return lastSent === null || milestone > lastSent ? milestone : null;
}

/** Todos os marcos de 0 até `last` (inclusive), na ordem. */
export function milestonesUpTo(last: number): number[] {
  const points: number[] = [];
  for (let s = 0; s <= last; s += bandOf(s).step) points.push(s);
  return points;
}
