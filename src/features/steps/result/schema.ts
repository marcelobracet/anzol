import { z } from "zod";
import { Id, Media, RichText, StepBase, Text } from "../shared/primitives";

export const ResultCondition = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scoreRange"), min: z.number().optional(), max: z.number().optional() }),
  z.object({ type: z.literal("tag"), tag: z.string().min(1), minCount: z.number().int().min(1).default(1) }),
]);

const ResultContent = z.object({ title: Text.min(1), body: RichText.optional(), media: Media.optional() });

export const ResultStep = StepBase.extend({
  type: z.literal("result"),
  // A primeira variante cuja condição casar vence; sem match usa fallback.
  variants: z.array(ResultContent.extend({ id: Id, when: ResultCondition })).max(10),
  fallback: ResultContent,
  ctaLabel: Text.min(1),
});
export type ResultStep = z.infer<typeof ResultStep>;
