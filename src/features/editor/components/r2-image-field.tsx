"use client";

import { useState } from "react";
import { signVoiceNoteUploadAction } from "../actions";
import { Field } from "./fields";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Mesmo caminho do vídeo da VSL: URL assinada pelo servidor e PUT direto no R2 (independe da chave do Cloudinary).
export async function putToR2(quizId: string, category: "audio" | "image", file: File): Promise<string> {
  const signed = await signVoiceNoteUploadAction(quizId, category, file.type);
  if (!signed.success) throw new Error(signed.error);
  const response = await fetch(signed.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!response.ok) throw new Error(`R2 recusou o envio (${response.status})`);
  return signed.data.publicUrl;
}

/** Imagem enviada ao R2; guarda só a URL pública. */
export function R2ImageField({ label, hint, value, quizId, round = false, onChange }: {
  label: string;
  hint?: string;
  value: string | undefined;
  quizId?: string;
  round?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(file: File | undefined) {
    if (!file || !quizId) return;
    if (file.size > MAX_IMAGE_BYTES) return setError("Imagem acima de 5 MB");
    setBusy(true);
    setError(undefined);
    try {
      onChange(await putToR2(quizId, "image", file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label} error={error} hint={hint}>
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no Studio
          <img src={value} alt="" className={`size-12 object-cover ${round ? "rounded-full" : "rounded-md"}`} />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || !quizId}
          className="text-xs file:mr-2 file:rounded file:border file:bg-background file:px-2 file:py-1"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {busy && <span className="text-xs text-muted-foreground">Enviando…</span>}
        {value && !busy && (
          <button type="button" className="text-xs text-destructive" onClick={() => onChange(undefined)}>
            Remover
          </button>
        )}
      </div>
    </Field>
  );
}
