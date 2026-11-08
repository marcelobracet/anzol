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

const EXTENSIONS: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
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

export function r2ObjectKey(quizId: string, contentType: string, id: string): string {
  return `vsl/${quizId}/${id}.${EXTENSIONS[contentType]}`;
}

type UploadRequest = { quizId: string; contentType: string; id: string };

// O browser envia o vídeo direto ao bucket com PUT; as chaves do R2 nunca saem do servidor.
export function signVideoUpload(env: R2Env, request: UploadRequest, now: Date = new Date()): Result<SignedVideoUpload> {
  if (!EXTENSIONS[request.contentType]) return { success: false, error: "Envie um vídeo MP4, MOV ou WebM" };
  const key = r2ObjectKey(request.quizId, request.contentType, request.id);
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
