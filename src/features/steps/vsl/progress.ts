import type { VslStep } from "./schema";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// Barra "otimista": anda rápido no início e desacelera, 1 - (1 - x)^k.
export function displayedProgress(currentTime: number, duration: number, k: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return 0;
  const x = clamp(currentTime / duration);
  return clamp(1 - (1 - x) ** k);
}

export function ctaVisible(watchedSeconds: number, showAt: number): boolean {
  return watchedSeconds >= showAt;
}

// O toast de compras começa `leadSeconds` antes do CTA aparecer.
export function toastWindowOpen(watchedSeconds: number, showAt: number, toast: VslStep["toast"]): boolean {
  return toast.enabled && watchedSeconds >= showAt - toast.leadSeconds;
}
