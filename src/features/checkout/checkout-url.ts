import type { Offer } from "@/features/quiz/document/schema";

// Repassados da URL do quiz ao checkout. src/sck são os campos de rastreamento da Hotmart.
export const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "src", "sck"] as const;
const MAX_VALUE_LENGTH = 200;

export function activePrice(offer: Offer, now: Date): "promo" | "full" {
  return offer.promo && new Date(offer.promo.expiresAt).getTime() > now.getTime() ? "promo" : "full";
}

// UTMs da URL do quiz sobrescrevem as do checkout; nada além delas é repassado.
export function buildCheckoutUrl(offer: Offer, options: { now: Date; pageSearch: string }): string {
  const base = activePrice(offer, options.now) === "promo" && offer.promo ? offer.promo.url : offer.fullPriceUrl;
  const page = new URLSearchParams(options.pageSearch);
  const tracking = TRACKING_PARAMS.flatMap((key) => {
    const value = page.get(key)?.trim();
    return value ? [[key, value.slice(0, MAX_VALUE_LENGTH)] as const] : [];
  });
  if (tracking.length === 0) return base;

  const url = new URL(base);
  for (const [key, value] of tracking) url.searchParams.set(key, value);
  return url.toString();
}
