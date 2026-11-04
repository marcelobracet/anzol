"use client";

import { useState } from "react";
import { z } from "zod";
import { MediaView } from "@/features/media/components/media-view";
import { uploadedToMedia } from "@/features/media/upload-media";
import type { AnimatedMedia, ImageMedia, Media } from "@/features/steps/shared/primitives";
import { signUploadAction } from "../actions";
import { Field, TextField } from "./fields";

type AnyMedia = z.infer<typeof Media>;
type ImageLike = z.infer<typeof ImageMedia> | z.infer<typeof AnimatedMedia>;

type Props<M extends AnyMedia> = {
  label: string;
  value: M | undefined;
  onChange: (value: M | undefined) => void;
  cloudName?: string;
  allowAnimated?: boolean;
};

const MAX_BYTES = 10 * 1024 * 1024;

async function upload(file: File): Promise<ImageLike> {
  const signed = await signUploadAction();
  if (!signed.success) throw new Error(signed.error);
  const body = new FormData();
  for (const [key, value] of Object.entries(signed.data.fields)) body.append(key, value);
  body.append("file", file);
  const response = await fetch(signed.data.uploadUrl, { method: "POST", body });
  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message ?? "Falha no upload");
  return uploadedToMedia(json);
}

export function MediaField<M extends AnyMedia>({ label, value, onChange, cloudName, allowAnimated = true }: Props<M>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return setError("Arquivo acima de 10 MB");
    setBusy(true);
    setError(undefined);
    try {
      const media = await upload(file);
      if (media.kind === "animated" && !allowAnimated) throw new Error("GIF não é aceito aqui");
      onChange(media as M);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Field label={label} error={error}>
        <input
          type="file"
          accept={allowAnimated ? "image/png,image/jpeg,image/webp,image/gif" : "image/png,image/jpeg,image/webp"}
          disabled={busy}
          className="text-xs file:mr-2 file:rounded file:border file:bg-background file:px-2 file:py-1"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </Field>
      {busy && <p className="text-xs text-muted-foreground">Enviando…</p>}
      {value && value.kind !== "video" && (
        <div className="grid gap-2 rounded-md border p-2">
          <div className="max-w-40">
            <MediaView media={value} cloudName={cloudName} sizes="160px" />
          </div>
          <TextField label="Texto alternativo" value={value.alt} maxLength={200} onChange={(alt) => onChange({ ...value, alt } as M)} />
          <button type="button" className="justify-self-start text-xs text-destructive" onClick={() => onChange(undefined)}>
            Remover imagem
          </button>
        </div>
      )}
    </div>
  );
}
