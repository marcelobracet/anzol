import { z } from "zod";
import { Id, ImageMedia, StepBase, Text } from "../shared/primitives";

export const SocialProofStep = StepBase.extend({
  type: z.literal("socialProof"),
  title: Text.optional(),
  layout: z.enum(["carousel", "stack"]).default("carousel"),
  items: z
    .array(
      z.object({
        id: Id,
        image: ImageMedia,
        caption: Text.optional(),
        // Rascunho aceita false; a publicação exige true (publish-rules).
        consentConfirmed: z.boolean(),
      }),
    )
    .min(1)
    .max(10),
  ctaLabel: Text.min(1),
});
export type SocialProofStep = z.infer<typeof SocialProofStep>;
