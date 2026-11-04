import { z } from "zod";
import { Id, ImageMedia, StepBase, Text } from "../shared/primitives";

export const QuestionOption = z.object({
  id: Id,
  label: Text.min(1),
  emoji: z.string().max(8).optional(),
  image: ImageMedia.optional(),
  score: z.number().default(0),
  tags: z.array(z.string().min(1).max(40)).max(5).default([]),
});

export const QuestionStep = StepBase.extend({
  type: z.literal("question"),
  title: Text.min(1),
  subtitle: Text.optional(),
  selection: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("single"), autoAdvance: z.boolean().default(true) }),
    z.object({
      mode: z.literal("multi"),
      min: z.number().int().min(1).default(1),
      max: z.number().int().min(1).optional(),
      ctaLabel: Text.min(1),
    }),
  ]),
  layout: z.enum(["list", "grid"]).default("list"),
  options: z.array(QuestionOption).min(2).max(12),
});
export type QuestionStep = z.infer<typeof QuestionStep>;
