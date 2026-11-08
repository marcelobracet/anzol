"use client";

import { useState } from "react";
import type { VideoMedia } from "@/features/steps/shared/primitives";
import { signVideoUploadAction } from "../actions";
import { Field, SelectField, TextField } from "./fields";

type Props = { value: VideoMedia | undefined; onChange: (value: VideoMedia | undefined) => void; quizId?: string; error?: string };

const SOURCES = [
  { value: "r2", label: "Arquivo (Cloudflare R2)" },
  { value: "bunny", label: "Bunny Stream" },
] as const;

const MAX_BYTES = 2 * 1024 * 1024 * 1024;

// PUT direto no bucket, com progresso (fetch não informa progresso de envio).
function putWithProgress(url: string, file: File, onProgress: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`R2 recusou o envio (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Falha de rede. Confira o CORS do bucket (README)."));
    xhr.send(file);
  });
}

export function VideoField({ value, onChange, quizId, error }: Props) {
  const [source, setSource] = useState<"r2" | "bunny">(value?.provider ?? "r2");
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string>();

  async function onFile(file: File | undefined) {
    if (!file || !quizId) return;
    if (file.size > MAX_BYTES) return setUploadError("Arquivo acima de 2 GB");
    setUploadError(undefined);
    setProgress(0);
    try {
      const signed = await signVideoUploadAction(quizId, file.type);
      if (!signed.success) throw new Error(signed.error);
      await putWithProgress(signed.data.uploadUrl, file, setProgress);
      onChange({ kind: "video", provider: "r2", url: signed.data.publicUrl, poster: value?.poster });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setProgress(null);
    }
  }

  const bunny = value?.provider === "bunny" ? value : { kind: "video" as const, provider: "bunny" as const, libraryId: "", videoId: "" };

  return (
    <div className="grid gap-3">
      <SelectField label="Origem do vídeo" value={source} options={SOURCES} onChange={setSource} />
      {source === "r2" ? (
        <>
          <Field label="Enviar vídeo (MP4, MOV ou WebM)" error={uploadError ?? error}>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              disabled={progress !== null || !quizId}
              className="text-xs file:mr-2 file:rounded file:border file:bg-background file:px-2 file:py-1"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </Field>
          {progress !== null && (
            <div className="grid gap-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Enviando… {Math.round(progress * 100)}%</p>
            </div>
          )}
          <TextField
            label="Ou cole a URL do vídeo"
            hint="Qualquer link https direto para .mp4 (ex.: arquivo já enviado pelo painel do R2)."
            value={value?.provider === "r2" ? value.url : ""}
            onChange={(url) => onChange(url.trim() ? { kind: "video", provider: "r2", url: url.trim(), poster: value?.poster } : undefined)}
          />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Library ID" value={bunny.libraryId} maxLength={40} onChange={(libraryId) => onChange({ ...bunny, libraryId: libraryId.trim() })} />
          <TextField label="Video ID" value={bunny.videoId} maxLength={60} onChange={(videoId) => onChange({ ...bunny, videoId: videoId.trim() })} />
        </div>
      )}
      {value ? (
        <button type="button" className="justify-self-start text-xs text-destructive" onClick={() => onChange(undefined)}>
          Remover vídeo (volta ao espaço reservado)
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">Sem vídeo, a página mostra um espaço reservado no lugar.</p>
      )}
    </div>
  );
}
