import { z } from "zod";
import { Id, Media, RichText, StepBase, Text, VoiceNote } from "../shared/primitives";

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
  // Mesmo áudio para todas as variantes (o título da variante personaliza o contexto).
  voiceNote: VoiceNote.optional(),
  ctaLabel: Text.min(1),
});
export type ResultStep = z.infer<typeof ResultStep>;
