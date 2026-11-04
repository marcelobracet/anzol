"use client";

import Image, { type ImageLoader } from "next/image";
import { z } from "zod";
import type { Media } from "@/features/steps/shared/primitives";
import { animatedUrl, imageUrl } from "../cloudinary";

type MediaValue = z.infer<typeof Media>;
type Props = { media: MediaValue; cloudName?: string; priority?: boolean; sizes?: string };

const MAX_WIDTH = 960;

export function MediaView({ media, cloudName, priority = false, sizes = "(max-width: 480px) 100vw, 448px" }: Props) {
  if (!cloudName) return null;
  const loader: ImageLoader = ({ src, width }) => imageUrl(cloudName, src, width);

  if (media.kind === "video") {
    // Player HLS chega com o step VSL; aqui só o poster.
    return media.poster ? <MediaView media={media.poster} cloudName={cloudName} priority={priority} sizes={sizes} /> : null;
  }

  if (media.kind === "animated") {
    return (
      <video
        className="h-auto w-full rounded-[var(--q-radius)]"
        src={animatedUrl(cloudName, media.publicId, Math.min(media.width, MAX_WIDTH))}
        width={media.width}
        height={media.height}
        autoPlay
        muted
        loop
        playsInline
        aria-label={media.alt || undefined}
      />
    );
  }

  return (
    <Image
      loader={loader}
      src={media.publicId}
      width={media.width}
      height={media.height}
      alt={media.alt}
      sizes={sizes}
      priority={priority}
      className="h-auto w-full rounded-[var(--q-radius)]"
    />
  );
}
