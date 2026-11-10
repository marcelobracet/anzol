import { z } from "zod";
import { Hex, Id, ImageMedia, StepBase, Text, VideoMedia } from "../shared/primitives";

export const BANNER_ICONS = ["none", "compass", "clock", "alert", "flame", "play", "gift", "star", "heart", "bell"] as const;
export const BANNER_ANIMATIONS = ["none", "pulse", "bounce", "shake", "spin", "blink"] as const;

// Visual da faixa do topo. Sem cores, usa o destaque do tema com texto de contraste automático.
export const BannerStyle = z.object({
  background: Hex.optional(),
  text: Hex.optional(),
  icon: z.enum(BANNER_ICONS).default("none"),
  iconImage: ImageMedia.optional(), // imagem própria no lugar do ícone
  animation: z.enum(BANNER_ANIMATIONS).default("pulse"),
});
export type BannerStyle = z.infer<typeof BannerStyle>;

// Tela sobre o vídeo antes do play com retomada e quando o visitante pausa.
export const PauseScreen = z.object({
  overlay: Hex.optional(), // padrão: preto
  opacity: z.number().int().min(0).max(100).default(55),
  text: Hex.optional(), // padrão: contraste automático
  blur: z.boolean().default(false),
  title: Text.optional(), // padrão: texto do idioma
  continueLabel: Text.optional(),
  restartLabel: Text.optional(),
});
export type PauseScreen = z.infer<typeof PauseScreen>;

export const VslStep = StepBase.extend({
  type: z.literal("vsl"),
  banner: Text.optional(), // faixa no topo da página
  bannerStyle: BannerStyle.default({ icon: "none", animation: "pulse" }),
  pauseScreen: PauseScreen.default({ opacity: 55, blur: false }),
  headline: Text.optional(),
  subheadline: Text.optional(),
  video: VideoMedia.optional(), // sem vídeo, mostra um espaço reservado
  aspect: z.enum(["16:9", "9:16"]).default("16:9"),
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
