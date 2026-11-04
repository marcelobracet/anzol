import { z } from "zod";
import { Media, RichText, StepBase, Text } from "../shared/primitives";

export const InfoStep = StepBase.extend({
  type: z.literal("info"),
  title: Text.min(1),
  body: RichText.optional(),
  media: Media.optional(),
  ctaLabel: Text.min(1),
});
export type InfoStep = z.infer<typeof InfoStep>;
