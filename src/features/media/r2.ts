import "server-only";
import { createHash, createHmac } from "node:crypto";
import type { Result } from "@/features/quiz/types";

export type R2Env = {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET: string;
  R2_PUBLIC_BASE_URL: string; // domínio público do bucket, ex.: https://media.seudominio.com
};

export type SignedVideoUpload = { uploadUrl: string; publicUrl: string };
export type SignedMediaUpload = SignedVideoUpload;

// Tipos aceitos por categoria → extensão do arquivo e pasta no bucket.
export type MediaCategory = "video" | "audio" | "image";
const CATEGORIES: Record<MediaCategory, { prefix: string; types: Record<string, string>; error: string }> = {
  video: { prefix: "vsl", types: { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" }, error: "Envie um vídeo MP4, MOV ou WebM" },
  audio: {
    prefix: "audio",
    types: {
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/webm": "webm",
    },
    error: "Envie um áudio MP3, M4A, AAC, OGG, WAV ou WebM",
  },
  image: { prefix: "img", types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }, error: "Envie uma imagem JPG, PNG ou WebP" },
};
const EXTENSIONS = CATEGORIES.video.types;
export const VIDEO_TYPES = Object.keys(EXTENSIONS);
const UPLOAD_EXPIRES_SECONDS = 60 * 60;

type PresignInput = {
  method: "GET" | "PUT";
  url: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  date: Date;
  expiresIn: number;
};

// RFC 3986: encodeURIComponent deixa passar !'()*, que a AWS exige codificados.
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: string | Buffer, value: string) => createHmac("sha256", key).update(value).digest();

// AWS Signature V4 em query string (o R2 fala o mesmo protocolo do S3). Só o header host é assinado.
export function presignUrl({ method, url, region, accessKeyId, secretAccessKey, date, expiresIn }: PresignInput): string {
  const target = new URL(url);
  const amzDate = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${region}/s3/aws4_request`;

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((key) => `${encode(key)}=${encode(query[key])}`)
    .join("&");
  const canonicalPath = target.pathname.split("/").map((part) => encode(decodeURIComponent(part))).join("/");
  const canonicalRequest = [method, canonicalPath, canonicalQuery, `host:${target.host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");

  const signingKey = ["s3", "aws4_request"].reduce(
    (key, part) => hmac(key, part),
    hmac(hmac(`AWS4${secretAccessKey}`, day), region),
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  return `${target.origin}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export function r2ObjectKey(quizId: string, contentType: string, id: string, category: MediaCategory = "video"): string {
  const { prefix, types } = CATEGORIES[category];
  return `${prefix}/${quizId}/${id}.${types[contentType]}`;
}

type UploadRequest = { quizId: string; contentType: string; id: string };

// O browser envia o vídeo direto ao bucket com PUT; as chaves do R2 nunca saem do servidor.
export function signVideoUpload(env: R2Env, request: UploadRequest, now: Date = new Date()): Result<SignedVideoUpload> {
  return signMediaUpload(env, { ...request, category: "video" }, now);
}

// Mesmo fluxo para áudio e imagem (balão de WhatsApp): não depende das permissões da chave do Cloudinary.
export function signMediaUpload(
  env: R2Env,
  request: UploadRequest & { category: MediaCategory },
  now: Date = new Date(),
): Result<SignedMediaUpload> {
  const category = CATEGORIES[request.category];
  if (!category.types[request.contentType]) return { success: false, error: category.error };
  const key = r2ObjectKey(request.quizId, request.contentType, request.id, request.category);
  const uploadUrl = presignUrl({
    method: "PUT",
    url: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`,
    region: "auto",
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    date: now,
    expiresIn: UPLOAD_EXPIRES_SECONDS,
  });
  return { success: true, data: { uploadUrl, publicUrl: `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${key}` } };
}
