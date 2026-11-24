"use client";

import { useState } from "react";
import { readAudioDuration } from "@/features/media/voice-note/audio-duration";
import { formatDuration } from "@/features/media/voice-note/waveform";
import type { AudioMedia, VoiceNote } from "@/features/steps/shared/primitives";
import { signVoiceNoteUploadAction } from "../actions";
import { ColorField, Field, NumberField, SelectField, TextField } from "./fields";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const AMBIENCES = [
  { value: "none", label: "Sem som de fundo" },
  { value: "room", label: "Ruído de ambiente (gerado, sem arquivo)" },
  { value: "file", label: "Áudio de fundo próprio (ex.: pessoas conversando)" },
] as const;

export const NEW_VOICE_NOTE: VoiceNote = {
  senderName: "Laura",
  senderColor: "#1f9d55",
  ambience: { kind: "room", volume: 20 },
};

// Mesmo caminho do vídeo da VSL: URL assinada pelo servidor e PUT direto no R2 (independe da chave do Cloudinary).
async function putToR2(quizId: string, category: "audio" | "image", file: File): Promise<string> {
  const signed = await signVoiceNoteUploadAction(quizId, category, file.type);
  if (!signed.success) throw new Error(signed.error);
  const response = await fetch(signed.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!response.ok) throw new Error(`R2 recusou o envio (${response.status})`);
  return signed.data.publicUrl;
}

async function uploadAudio(quizId: string, file: File): Promise<AudioMedia> {
  const durationSec = await readAudioDuration(file); // antes do envio: arquivo ilegível nem sobe
  return { kind: "audio", url: await putToR2(quizId, "audio", file), durationSec };
}

function AudioUpload({ label, hint, value, quizId, onChange }: {
  label: string;
  hint?: string;
  value: AudioMedia | undefined;
  quizId?: string;
  onChange: (value: AudioMedia | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(file: File | undefined) {
    if (!file || !quizId) return;
    if (file.size > MAX_AUDIO_BYTES) return setError("Arquivo acima de 20 MB");
    setBusy(true);
    setError(undefined);
    try {
      onChange(await uploadAudio(quizId, file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Field label={label} error={error} hint={hint}>
        <input
          type="file"
          accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav,audio/webm"
          disabled={busy || !quizId}
          className="text-xs file:mr-2 file:rounded file:border file:bg-background file:px-2 file:py-1"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </Field>
      {busy && <p className="text-xs text-muted-foreground">Enviando…</p>}
      {value && (
        <div className="grid gap-1 rounded-md border p-2">
          <audio controls preload="none" src={value.url} className="w-full" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Duração: {formatDuration(value.durationSec)}</span>
            <button type="button" className="text-destructive" onClick={() => onChange(undefined)}>
              Remover áudio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarUpload({ value, quizId, onChange }: {
  value: string | undefined;
  quizId?: string;
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
    <Field label="Foto (avatar)" error={error} hint="Quadrada, até 5 MB. Aparece redonda ao lado do áudio.">
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no Studio
          <img src={value} alt="" className="size-12 rounded-full object-cover" />
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

/** Configura o áudio estilo WhatsApp de um step. `value` undefined = sem áudio. */
export function VoiceNoteField({ value, onChange, quizId }: {
  value: VoiceNote | undefined;
  onChange: (value: VoiceNote | undefined) => void;
  quizId?: string;
}) {
  if (!value) {
    return (
      <button
        type="button"
        className="justify-self-start rounded-md border border-dashed px-3 py-2 text-sm"
        onClick={() => onChange(NEW_VOICE_NOTE)}
      >
        + Adicionar áudio estilo WhatsApp
      </button>
    );
  }
  const set = (patch: Partial<VoiceNote>) => onChange({ ...value, ...patch });
  const ambience = value.ambience;

  return (
    <div className="grid gap-3 rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Áudio estilo WhatsApp</h3>
        <button type="button" className="text-xs text-destructive" onClick={() => onChange(undefined)}>
          Remover
        </button>
      </div>
      <AudioUpload
        label="Áudio (mp3, m4a, ogg, wav)"
        hint="Até 20 MB e 10 minutos. MP3 é o mais compatível (o export padrão do ElevenLabs)."
        value={value.audio}
        quizId={quizId}
        onChange={(audio) => set({ audio })}
      />
      <TextField
        label="Nome de quem envia"
        maxLength={60}
        hint="Aparece em cima do áudio, como num grupo do WhatsApp. Use o nome real da apresentadora/equipe; não atribua título profissional que ela não tem."
        value={value.senderName}
        onChange={(senderName) => set({ senderName })}
      />
      <ColorField label="Cor do nome" value={value.senderColor} onChange={(senderColor) => set({ senderColor })} />
      <AvatarUpload value={value.avatarUrl} quizId={quizId} onChange={(avatarUrl) => set({ avatarUrl })} />
      <SelectField
        label="Som de fundo"
        value={ambience.kind}
        options={AMBIENCES}
        onChange={(kind) => set({ ambience: { ...ambience, kind } })}
      />
      {ambience.kind !== "none" && (
        <NumberField
          label="Volume do fundo (0 a 100)"
          hint="Baixo (10 a 25) soa natural; alto atrapalha a voz."
          min={0}
          max={100}
          step={5}
          value={ambience.volume}
          onChange={(volume) => set({ ambience: { ...ambience, volume: Math.min(100, Math.max(0, Math.round(volume ?? 0))) } })}
        />
      )}
      {ambience.kind === "file" && (
        <AudioUpload
          label="Áudio de fundo (toca em loop)"
          hint="Ex.: café, restaurante, pessoas conversando. Use áudio livre de direitos (Pixabay, Freesound CC0)."
          value={ambience.file}
          quizId={quizId}
          onChange={(file) => set({ ambience: { ...ambience, file } })}
        />
      )}
    </div>
  );
}
