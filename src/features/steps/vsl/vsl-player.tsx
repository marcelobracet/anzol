"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/features/runtime/i18n";
import { pauseOverlayStyle } from "@/features/runtime/page-style";
import { displayedProgress } from "./progress";
import type { VslStep } from "./schema";
import type { VideoSource } from "./video-source";

type Props = {
  step: VslStep;
  source: VideoSource;
  locale: string;
  resumeAt: number; // segundos já assistidos (retomada)
  onWatched: (seconds: number) => void;
};

const HLS_MIME = "application/vnd.apple.mpegurl";

// Começa mudo em autoplay; o toque liga o som. Sem controles de busca.
export function VslPlayer({ step, source, locale, resumeAt, onWatched }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState<"no" | "paused" | "ended">("no");
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const { src, hls } = source;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!hls || video.canPlayType(HLS_MIME)) {
      video.src = src; // arquivo direto, ou Safari tocando HLS nativo
      return;
    }
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return;
      const player = new Hls({ capLevelToPlayerSize: true });
      player.loadSource(src);
      player.attachMedia(video);
      destroy = () => player.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src, hls]);

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setTime({ current: video.currentTime, duration: video.duration });
    if (started && !video.muted) onWatched(video.currentTime);
  };

  // Autoplay com som é bloqueado pelo navegador: o toque liga o som e começa do ponto escolhido.
  const start = (from: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = from;
    video.muted = false;
    void video.play();
    setStarted(true);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const screen = step.pauseScreen;
  const overlay = pauseOverlayStyle(screen);
  const continueLabel = screen.continueLabel || t(locale, "resumeContinue");
  const restartLabel = screen.restartLabel || t(locale, "resumeRestart");
  const resume = () => {
    setPaused("no");
    void videoRef.current?.play();
  };

  const progress = displayedProgress(time.current, time.duration, step.progressBar.k);
  const accent = step.accentColor ?? "var(--q-accent)";
  const vertical = step.aspect === "9:16";

  return (
    <div className={`overflow-hidden rounded-[var(--q-radius)] bg-black shadow-lg ${vertical ? "mx-auto w-full max-w-[min(100%,24rem,calc((100dvh-9rem)*9/16))]" : ""}`}>
      <div className={`relative ${vertical ? "aspect-[9/16]" : "aspect-video"}`}>
        <video
          ref={videoRef}
          className="size-full object-contain"
          poster={source.poster}
          autoPlay
          muted={!started}
          playsInline
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onPause={(e) => started && setPaused(e.currentTarget.ended ? "ended" : "paused")}
          onPlay={() => setPaused("no")}
          onClick={started ? togglePlay : () => start(resumeAt)}
        />
        {started && paused !== "no" && (
          <div style={overlay} className="absolute inset-0 grid place-items-center p-6">
            <div className="grid justify-items-start gap-4">
              <p className="text-lg font-bold text-balance">{screen.title || t(locale, "pausedTitle")}</p>
              {paused === "paused" && <ResumeOption icon="▶" label={continueLabel} onClick={resume} />}
              <ResumeOption icon="↺" label={restartLabel} onClick={() => start(0)} />
            </div>
          </div>
        )}
        {!started && (
          <div style={resumeAt > 0 ? overlay : undefined} className={`absolute inset-0 grid place-items-center p-6 ${resumeAt > 0 ? "" : "bg-black/45 text-white"}`}>
            {resumeAt > 0 ? (
              <div className="grid justify-items-start gap-4">
                <p className="text-lg font-bold text-balance">{screen.title || t(locale, "resumeTitle")}</p>
                <ResumeOption icon="▶" label={continueLabel} onClick={() => start(resumeAt)} />
                <ResumeOption icon="↺" label={restartLabel} onClick={() => start(0)} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => start(0)}
                className="rounded-[var(--q-radius)] bg-[var(--q-primary)] px-5 py-3 text-base font-semibold text-[var(--q-on-primary)] shadow-lg"
              >
                🔊 {t(locale, "tapToUnmute")}
              </button>
            )}
          </div>
        )}
      </div>
      {step.progressBar.enabled && (
        <div className="h-1.5 bg-white/20" aria-hidden>
          <div className="h-full transition-[width] duration-500 ease-linear" style={{ width: `${progress * 100}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

function ResumeOption({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-base font-semibold">
      <span className="grid size-9 place-items-center rounded-full border-2 border-current text-sm">{icon}</span>
      {label}
    </button>
  );
}
