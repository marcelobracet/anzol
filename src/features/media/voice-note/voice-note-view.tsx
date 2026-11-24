"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import type { VoiceNote } from "@/features/steps/shared/primitives";
import { createAmbience, type Ambience } from "./ambience";
import { formatDuration, nextSpeed, waveformBars } from "./waveform";

const noopSubscribe = () => () => {};
const localClock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Cores do WhatsApp (tema claro).
const WA = {
  chat: "#efeae2",
  bubble: "#ffffff",
  icon: "#54656f",
  meta: "#667781",
  barIdle: "#c3ccd2",
  barPlayed: "#54656f",
  unheard: "#00a884",
  heard: "#53bdeb",
};

type Props = { note: VoiceNote };

/** Balão de áudio no estilo WhatsApp. Só aparece quando o áudio já foi enviado. */
export function VoiceNoteView({ note }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ambienceRef = useRef<Ambience | null>(null);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState(1);

  const bars = useMemo(() => waveformBars(note.audio?.url ?? note.senderName), [note.audio?.url, note.senderName]);
  const duration = note.audio?.durationSec ?? 0;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  // Hora da "mensagem" no fuso de quem vê: vazia no servidor, preenchida no navegador (sem divergir na hidratação).
  const clock = useSyncExternalStore(noopSubscribe, localClock, () => "");

  useEffect(() => () => ambienceRef.current?.dispose(), []);

  if (!note.audio) return null;
  const src = note.audio.url;
  const ambienceSrc = note.ambience.file?.url;

  function ambience(): Ambience | null {
    if (!ambienceRef.current) ambienceRef.current = createAmbience(note.ambience.kind, note.ambience.volume, ambienceSrc);
    return ambienceRef.current;
  }

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.ended || audio.currentTime >= (audio.duration || duration) - 0.05) audio.currentTime = 0;
      audio.playbackRate = speed;
      try {
        await audio.play();
        ambience()?.play();
        setHeard(true);
      } catch {
        // Navegador bloqueou: o próximo toque tenta de novo.
      }
    } else {
      audio.pause();
    }
  }

  function seek(e: PointerEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrent(audio.currentTime);
  }

  function changeSpeed() {
    const next = nextSpeed(speed);
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  const accent = heard ? WA.heard : WA.unheard;
  const avatar = note.avatarUrl;

  return (
    <div className="mt-5 rounded-[var(--q-radius)] p-3" style={{ background: WA.chat }}>
      <div
        className="relative max-w-sm rounded-lg rounded-tl-none px-2.5 pt-1.5 pb-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
        style={{ background: WA.bubble }}
      >
        {/* Bico do balão */}
        <svg className="absolute top-0 -left-2" width="8" height="13" viewBox="0 0 8 13" aria-hidden>
          <path d="M8 0H1.5C.4 0-.3 1.2.3 2.1L8 13V0z" fill={WA.bubble} />
        </svg>

        <p className="text-[13px] leading-5 font-semibold" style={{ color: note.senderColor }}>
          {note.senderName}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggle()}
            aria-label={playing ? "Pausar áudio" : "Ouvir áudio"}
            className="grid size-9 shrink-0 place-content-center"
            style={{ color: WA.icon }}
          >
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div
              role="slider"
              aria-label="Posição do áudio"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(current)}
              tabIndex={0}
              onPointerDown={seek}
              className="relative flex h-7 cursor-pointer touch-none items-center gap-[2px]"
            >
              {bars.map((height, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-full"
                  style={{
                    height: `${Math.round(height * 100)}%`,
                    minWidth: 2,
                    background: (i + 0.5) / bars.length <= progress ? WA.barPlayed : WA.barIdle,
                  }}
                />
              ))}
              {/* Bolinha de posição */}
              <span
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${progress * 100}%`, background: accent }}
              />
            </div>
            <div className="flex justify-between text-[11px] leading-4" style={{ color: WA.meta }}>
              <span>{formatDuration(playing || current > 0 ? current : duration)}</span>
              <span>{clock}</span>
            </div>
          </div>

          {playing ? (
            <button
              type="button"
              onClick={changeSpeed}
              className="grid h-6 min-w-11 shrink-0 place-content-center rounded-full px-2 text-[12px] font-semibold text-white"
              style={{ background: "#8696a0" }}
              aria-label="Velocidade do áudio"
            >
              {speed}×
            </button>
          ) : (
            <div className="relative size-12 shrink-0">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar pequeno do R2
                <img src={avatar} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <span className="grid size-12 place-content-center rounded-full bg-[#dfe5e7] text-lg font-semibold text-white">
                  {note.senderName.charAt(0)}
                </span>
              )}
              {/* Microfone: verde antes de ouvir, azul depois (como no WhatsApp) */}
              <svg className="absolute -bottom-0.5 -left-1" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill={accent}
                  d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 1 0-7 0v6A3.5 3.5 0 0 0 12 15zm6.2-3.6a.9.9 0 0 0-1.8 0 4.4 4.4 0 0 1-8.8 0 .9.9 0 0 0-1.8 0 6.2 6.2 0 0 0 5.3 6.1V20h-2a.9.9 0 0 0 0 1.8h5.8a.9.9 0 0 0 0-1.8h-2v-2.5a6.2 6.2 0 0 0 5.1-6.1z"
                />
              </svg>
            </div>
          )}
        </div>

        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            ambienceRef.current?.pause();
          }}
          onEnded={() => {
            setPlaying(false);
            ambienceRef.current?.pause();
          }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        />
      </div>
    </div>
  );
}
