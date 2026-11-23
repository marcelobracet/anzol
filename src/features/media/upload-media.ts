import { z } from "zod";
import type { AnimatedMedia, AudioMedia, ImageMedia } from "@/features/steps/shared/primitives";

// Resposta do upload do Cloudinary -> mídia do documento.
const UploadResponse = z.object({
  public_id: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string(),
});

export function uploadedToMedia(raw: unknown): z.infer<typeof ImageMedia> | z.infer<typeof AnimatedMedia> {
  const upload = UploadResponse.parse(raw);
  return {
    kind: upload.format === "gif" ? "animated" : "image",
    publicId: upload.public_id,
    width: upload.width,
    height: upload.height,
    alt: "",
  };
}

// Upload de áudio (resource_type "video"): o Cloudinary devolve a duração em segundos.
const AudioUploadResponse = z.object({
  public_id: z.string().min(1),
  duration: z.number().positive(),
  resource_type: z.literal("video"),
});

export function uploadedToAudio(raw: unknown): AudioMedia {
  const upload = AudioUploadResponse.parse(raw);
  if (upload.duration > 600) throw new Error("Áudio acima de 10 minutos");
  return { kind: "audio", publicId: upload.public_id, durationSec: Math.round(upload.duration * 10) / 10 };
}
