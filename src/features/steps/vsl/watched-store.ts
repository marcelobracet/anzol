// Tempo máximo assistido por VSL, no localStorage (com fallback em memória para aba privada).
const memory = new Map<string, number>();
const listeners = new Set<() => void>();
const key = (stepId: string) => `anzol:vsl:${stepId}`;

export function readWatched(stepId: string): number {
  let stored = 0;
  try {
    stored = Number(window.localStorage.getItem(key(stepId))) || 0;
  } catch {
    // storage bloqueado
  }
  return Math.max(stored, memory.get(stepId) ?? 0);
}

export function saveWatched(stepId: string, seconds: number): void {
  const whole = Math.floor(seconds);
  if (whole <= readWatched(stepId)) return;
  memory.set(stepId, whole);
  try {
    window.localStorage.setItem(key(stepId), String(whole));
  } catch {
    // segue só em memória
  }
  listeners.forEach((listener) => listener());
}

export function subscribeWatched(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
