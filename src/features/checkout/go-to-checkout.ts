import type { Offer } from "@/features/quiz/document/schema";
import { buildCheckoutUrl } from "./checkout-url";

// Monta a URL no clique (promo pode ter expirado e as UTMs estão na URL atual).
export function goToCheckout(offer: Offer, embedded: boolean): void {
  const url = buildCheckoutUrl(offer, { now: new Date(), pageSearch: window.location.search });
  if (embedded) window.open(url, "_blank", "noopener");
  else window.location.assign(url);
}
