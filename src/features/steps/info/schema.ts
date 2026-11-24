import { z } from "zod";
import { HttpsUrl, Media, RichText, StepBase, Text, VoiceNote } from "../shared/primitives";

export const InfoStep = StepBase.extend({
  type: z.literal("info"),
  title: Text.min(1),
  body: RichText.optional(),
  media: Media.optional(),
  voiceNote: VoiceNote.optional(),
  // Depois do áudio: imagem (R2) e texto, ex.: o que a pessoa vai ver a seguir.
  below: z
    .object({
      imageUrl: HttpsUrl.optional(),
      imageAlt: Text.max(200).optional(),
      text: RichText.optional(),
    })
    .optional(),
  ctaLabel: Text.min(1),
});
export type InfoStep = z.infer<typeof InfoStep>;
