import { z } from "zod";
import { Id, StepBase, Text } from "../shared/primitives";

// Só publica se a oferta tiver promo com expiresAt futuro (publish-rules).
export const OfferTimerStep = StepBase.extend({
  type: z.literal("offerTimer"),
  offerId: Id,
  title: Text.min(1),
  expiredText: Text.min(1),
});
export type OfferTimerStep = z.infer<typeof OfferTimerStep>;
