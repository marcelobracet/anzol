export type Countdown = { expired: boolean; days: number; hours: number; minutes: number; seconds: number };

const EXPIRED: Countdown = { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

// Contagem até uma data real (promo.expiresAt). Nunca reinicia nem é "evergreen".
export function countdown(expiresAt: string | undefined, now: Date): Countdown {
  if (!expiresAt) return EXPIRED;
  const remaining = Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000);
  if (!Number.isFinite(remaining) || remaining <= 0) return EXPIRED;
  return {
    expired: false,
    days: Math.floor(remaining / 86_400),
    hours: Math.floor((remaining % 86_400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
  };
}
