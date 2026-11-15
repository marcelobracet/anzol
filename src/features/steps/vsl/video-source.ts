import { imageUrl } from "@/features/media/cloudinary";
import type { VideoMedia } from "../shared/primitives";

export type VideoSource = { src: string; hls: boolean; poster?: string };

const POSTER_WIDTH = 720;

// R2: arquivo direto ("#t=0.001" faz o iOS mostrar o 1º quadro sem poster). Bunny: HLS da pull zone.
// Capa enviada no Studio vence a thumbnail do Bunny: é o que o visitante vê enquanto o vídeo carrega.
export function videoSource(video: VideoMedia | undefined, bunnyHost: string | undefined, cloudName?: string): VideoSource | null {
  if (!video) return null;
  const poster = video.poster && cloudName ? imageUrl(cloudName, video.poster.publicId, POSTER_WIDTH) : undefined;
  if (video.provider === "r2") return poster ? { src: `${video.url}#t=0.001`, hls: false, poster } : { src: `${video.url}#t=0.001`, hls: false };
  if (!bunnyHost) return null;
  const base = `https://${bunnyHost}/${encodeURIComponent(video.videoId)}`;
  return { src: `${base}/playlist.m3u8`, poster: poster ?? `${base}/thumbnail.jpg`, hls: true };
}
