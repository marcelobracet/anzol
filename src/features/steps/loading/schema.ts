import { z } from "zod";
import { StepBase, Text } from "../shared/primitives";

export const LoadingStep = StepBase.extend({
  type: z.literal("loading"),
  title: Text.min(1),
  messages: z
    .array(z.object({ text: Text.min(1), durationMs: z.number().int().min(300).max(10_000) }))
    .min(1)
    .max(10),
});
export type LoadingStep = z.infer<typeof LoadingStep>;
