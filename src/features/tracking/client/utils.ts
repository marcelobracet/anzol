import { TRACKING_PARAMS } from "@/features/checkout/checkout-url";

export type ConsentState = "pending" | "not_required" | "ask" | "granted" | "denied";
type Utm = Partial<Record<(typeof TRACKING_PARAMS)[number], string>>;

export function readUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    TRACKING_PARAMS.flatMap((key) => {
      const value = params.get(key)?.trim();
      return value ? [[key, value.slice(0, 200)]] : [];
    }),
  );
}

export function readCookie(cookies: string, name: string): string | undefined {
  const match = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

// Formato da Meta: fb.1.<timestamp ms>.<fbclid>
export function fbcFromClick(search: string, nowMs: number): string | undefined {
  const fbclid = new URLSearchParams(search).get("fbclid");
  return fbclid ? `fb.1.${nowMs}.${fbclid}` : undefined;
}

export function initialConsent({ euLocale, euVisitor, saved }: { euLocale: boolean; euVisitor: boolean; saved: string | null }): ConsentState {
  if (!euLocale && !euVisitor) return "not_required";
  if (saved === "granted" || saved === "denied") return saved;
  return "ask";
}

export const pixelAllowed = (state: ConsentState) => state === "not_required" || state === "granted";
