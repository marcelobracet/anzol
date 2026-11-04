import { z } from "zod";
import type { AnimatedMedia, ImageMedia } from "@/features/steps/shared/primitives";

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
