"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/features/runtime/i18n";
import { displayedProgress } from "./progress";
import type { VslStep } from "./schema";

type Props = {
  step: VslStep;
  bunnyHost: string;
  locale: string;
  resumeAt: number; // segundos já assistidos (retomada)
  onWatched: (seconds: number) => void;
};

const HLS_MIME = "application/vnd.apple.mpegurl";

// Começa mudo em autoplay; o toque liga o som. Sem controles de busca.
export function VslPlayer({ step, bunnyHost, locale, resumeAt, onWatched }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const { videoId } = step.video;
  const src = `https://${bunnyHost}/${encodeURIComponent(videoId)}/playlist.m3u8`;
  const poster = `https://${bunnyHost}/${encodeURIComponent(videoId)}/thumbnail.jpg`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType(HLS_MIME)) {
      video.src = src; // Safari toca HLS nativo
      return;
    }
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return;
      const hls = new Hls({ capLevelToPlayerSize: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      destroy = () => hls.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src]);

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setTime({ current: video.currentTime, duration: video.duration });
    if (started && !video.muted) onWatched(video.currentTime);
  };

  const unmute = () => {
    const video = videoRef.current;
    if (!video) return;
    // Autoplay com som é bloqueado pelo navegador: o toque liga o som e começa (ou retoma).
    video.currentTime = resumeAt;
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

  const progress = displayedProgress(time.current, time.duration, step.progressBar.k);
  const accent = step.accentColor ?? "var(--q-accent)";

  return (
    <div className="overflow-hidden rounded-[var(--q-radius)] bg-black">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="size-full"
          poster={poster}
          autoPlay
          muted={!started}
          playsInline
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onClick={started ? togglePlay : unmute}
        />
        {!started && (
          <button
            type="button"
            onClick={unmute}
            className="absolute inset-0 grid place-items-center bg-black/40 text-white"
          >
            <span className="rounded-[var(--q-radius)] bg-[var(--q-primary)] px-5 py-3 text-base font-semibold text-[var(--q-on-primary)] shadow-lg">
              🔊 {t(locale, "tapToUnmute")}
            </span>
          </button>
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
