import { z } from "zod";
import { Id, StepBase, Text } from "../shared/primitives";

// Só publica se a oferta tiver promo com expiresAt futuro (publish-rules).
export const OfferTimerStep = StepBase.extend({
  type: z.literal("offerTimer"),
  offerId: Id,
  title: Text.min(1),
  expiredText: Text.min(1),
  ctaLabel: Text.min(1).default("Continuar"), // avança; se for o último step, vai ao checkout
});
export type OfferTimerStep = z.infer<typeof OfferTimerStep>;
