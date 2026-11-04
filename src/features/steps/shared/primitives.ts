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

export const VideoMedia = z.object({
  kind: z.literal("video"),
  libraryId: z.string().min(1), // Bunny Stream
  videoId: z.string().min(1),
  poster: ImageMedia.optional(),
});

export const Media = z.discriminatedUnion("kind", [ImageMedia, AnimatedMedia, VideoMedia]);

export const StepBase = z.object({
  id: Id,
  name: z.string().min(1).max(80), // rótulo interno no Studio e no funil
  hidden: z.boolean().default(false),
});
