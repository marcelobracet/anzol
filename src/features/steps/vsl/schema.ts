import { z } from "zod";
import { Hex, Id, StepBase, Text, VideoMedia } from "../shared/primitives";

export const VslStep = StepBase.extend({
  type: z.literal("vsl"),
  headline: Text.optional(),
  video: VideoMedia,
  accentColor: Hex.optional(), // padrão: theme.colors.accent
  // Progresso exibido = 1 - (1 - x)^k, x = tempo assistido / duração.
  progressBar: z
    .object({ enabled: z.boolean().default(true), k: z.number().min(1).max(10).default(3) })
    .default({ enabled: true, k: 3 }),
  cta: z.object({ label: Text.min(1), showAt: z.number().int().min(0), offerId: Id }),
  // Alimentado só pela tabela purchases; sem compras, não renderiza.
  toast: z
    .object({
      enabled: z.boolean().default(true),
      leadSeconds: z.number().int().min(0).default(30),
      windowHours: z.number().int().min(1).max(168).default(48),
    })
    .default({ enabled: true, leadSeconds: 30, windowHours: 48 }),
}).refine((s) => !s.toast.enabled || s.toast.leadSeconds <= s.cta.showAt, {
  message: "toast.leadSeconds não pode ser maior que cta.showAt",
  path: ["toast", "leadSeconds"],
});
export type VslStep = z.infer<typeof VslStep>;
