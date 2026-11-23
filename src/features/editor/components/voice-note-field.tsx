"use client";

import { useState } from "react";
import { audioUrl } from "@/features/media/cloudinary";
import { uploadedToAudio } from "@/features/media/upload-media";
import { formatDuration } from "@/features/media/voice-note/waveform";
import type { AudioMedia, VoiceNote } from "@/features/steps/shared/primitives";
import { signAudioUploadAction } from "../actions";
import { ColorField, Field, NumberField, SelectField, TextField } from "./fields";
import { MediaField } from "./media-field";

const MAX_BYTES = 20 * 1024 * 1024;

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

async function uploadAudio(file: File): Promise<AudioMedia> {
  const signed = await signAudioUploadAction();
  if (!signed.success) throw new Error(signed.error);
  const body = new FormData();
  for (const [key, value] of Object.entries(signed.data.fields)) body.append(key, value);
  body.append("file", file);
  const response = await fetch(signed.data.uploadUrl, { method: "POST", body });
  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message ?? "Falha no upload");
  return uploadedToAudio(json);
}

function AudioUpload({ label, hint, value, cloudName, onChange }: {
  label: string;
  hint?: string;
  value: AudioMedia | undefined;
  cloudName?: string;
  onChange: (value: AudioMedia | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return setError("Arquivo acima de 20 MB");
    setBusy(true);
    setError(undefined);
    try {
      onChange(await uploadAudio(file));
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
          accept="audio/*"
          disabled={busy}
          className="text-xs file:mr-2 file:rounded file:border file:bg-background file:px-2 file:py-1"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </Field>
      {busy && <p className="text-xs text-muted-foreground">Enviando para o Cloudinary…</p>}
      {value && cloudName && (
        <div className="grid gap-1 rounded-md border p-2">
          <audio controls preload="none" src={audioUrl(cloudName, value.publicId)} className="w-full" />
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

/** Configura o áudio estilo WhatsApp de um step. `value` undefined = sem áudio. */
export function VoiceNoteField({ value, onChange, cloudName }: {
  value: VoiceNote | undefined;
  onChange: (value: VoiceNote | undefined) => void;
  cloudName?: string;
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
        hint="Até 20 MB. Vai para o Cloudinary e é entregue em mp3."
        value={value.audio}
        cloudName={cloudName}
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
      <MediaField
        label="Foto (avatar)"
        value={value.avatar}
        allowAnimated={false}
        cloudName={cloudName}
        onChange={(avatar) => set({ avatar: avatar?.kind === "image" ? avatar : undefined })}
      />
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
          cloudName={cloudName}
          onChange={(file) => set({ ambience: { ...ambience, file } })}
        />
      )}
    </div>
  );
}
