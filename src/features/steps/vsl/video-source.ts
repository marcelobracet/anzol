import type { VideoMedia } from "../shared/primitives";

export type VideoSource = { src: string; hls: boolean; poster?: string };

// R2: arquivo direto ("#t=0.001" faz o iOS mostrar o 1º quadro sem poster). Bunny: HLS da pull zone.
export function videoSource(video: VideoMedia | undefined, bunnyHost: string | undefined): VideoSource | null {
  if (!video) return null;
  if (video.provider === "r2") return { src: `${video.url}#t=0.001`, hls: false };
  if (!bunnyHost) return null;
  const base = `https://${bunnyHost}/${encodeURIComponent(video.videoId)}`;
  return { src: `${base}/playlist.m3u8`, poster: `${base}/thumbnail.jpg`, hls: true };
}
