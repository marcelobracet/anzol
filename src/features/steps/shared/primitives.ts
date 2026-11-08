import { customAlphabet } from "nanoid";
import { z } from "zod";

export const Id = z.string().regex(/^[a-zA-Z0-9_-]{4,32}$/, "Id inválido");
export const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser #RRGGBB");
// Aceita interpolação: {{lead.firstName}}, {{answer.<stepId>}}
export const Text = z.string().max(500);
// Markdown restrito (negrito, itálico, destaque, quebra), renderizado no servidor.
export const RichText = z.string().max(5000);
export const HttpsUrl = z.url({ protocol: /^https$/, error: "URL deve começar com https://" });

export const newId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export const ImageMedia = z.object({
  kind: z.literal("image"),
  publicId: z.string().min(1), // Cloudinary
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().max(200).default(""),
});

// GIF enviado ao Cloudinary e entregue como mp4/webm.
export const AnimatedMedia = ImageMedia.extend({ kind: z.literal("animated") });

// Bunny Stream (HLS). Documentos antigos não têm provider: viram "bunny".
export const BunnyVideo = z.object({
  kind: z.literal("video"),
  provider: z.literal("bunny").default("bunny"),
  libraryId: z.string().min(1),
  videoId: z.string().min(1),
  poster: ImageMedia.optional(),
});

// Arquivo (mp4/webm) servido por URL pública, ex.: bucket do Cloudflare R2.
export const FileVideo = z.object({
  kind: z.literal("video"),
  provider: z.literal("r2"),
  url: HttpsUrl,
  poster: ImageMedia.optional(),
});

export const VideoMedia = z.union([FileVideo, BunnyVideo]);
export type VideoMedia = z.infer<typeof VideoMedia>;

export const Media = z.union([ImageMedia, AnimatedMedia, FileVideo, BunnyVideo]);

export const StepBase = z.object({
  id: Id,
  name: z.string().min(1).max(80), // rótulo interno no Studio e no funil
  hidden: z.boolean().default(false),
});
