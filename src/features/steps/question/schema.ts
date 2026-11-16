import { z } from "zod";
import { Id, ImageMedia, Media, StepBase, Text } from "../shared/primitives";

export const QuestionOption = z.object({
  id: Id,
  label: Text.min(1),
  emoji: z.string().max(8).optional(),
  image: ImageMedia.optional(),
  score: z.number().default(0),
  tags: z.array(z.string().min(1).max(40)).max(5).default([]),
});

// Data em 3 caixas (dia, mês, ano). As opções da pergunta são os 12 meses: só o mês vira resposta
// (tags e pontos); dia e ano servem para a pessoa se reconhecer na pergunta.
export const DateParts = z
  .object({
    dayLabel: Text.min(1),
    monthLabel: Text.min(1),
    yearLabel: Text.min(1),
    placeholder: Text.optional(), // padrão: "—"
    yearFrom: z.number().int().min(1900).max(2100),
    yearTo: z.number().int().min(1900).max(2100),
  })
  .refine((d) => d.yearFrom <= d.yearTo, "Ano inicial maior que o final");
export type DateParts = z.infer<typeof DateParts>;

export const QuestionStep = StepBase.extend({
  type: z.literal("question"),
  badge: Text.optional(), // selo acima do título, ex.: "TESTE GRATUITO"
  title: Text.min(1), // ==trecho== fica na cor de destaque
  subtitle: Text.optional(), // aceita **negrito**
  media: Media.optional(), // imagem entre o subtítulo e as opções
  mediaCaption: Text.optional(),
  prompt: Text.optional(), // rótulo curto logo acima das opções, ex.: "Você é:"
  footnote: Text.optional(), // linha pequena abaixo das opções
  optionStyle: z.enum(["card", "filled"]).default("card"), // filled: botão na cor primária
  selection: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("single"), autoAdvance: z.boolean().default(true) }),
    z.object({
      mode: z.literal("multi"),
      min: z.number().int().min(1).default(1),
      max: z.number().int().min(1).optional(),
      ctaLabel: Text.min(1),
    }),
  ]),
  layout: z.enum(["list", "grid", "date"]).default("list"),
  date: DateParts.optional(), // obrigatório no layout "date"
  options: z.array(QuestionOption).min(2).max(12),
}).refine((s) => s.layout !== "date" || (s.date && s.selection.mode === "single"), {
  message: "Layout de data precisa das caixas configuradas e de escolha única",
  path: ["date"],
});
export type QuestionStep = z.infer<typeof QuestionStep>;
