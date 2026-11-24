import "server-only";
import { createHash } from "node:crypto";

export type CloudinaryCredentials = { cloudName: string; apiKey: string; apiSecret: string };
export type SignedUpload = { uploadUrl: string; fields: Record<string, string> };

const FOLDER = "anzol";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif";

// Assinatura do Cloudinary: params ordenados "k=v&k=v" + api_secret, SHA-1 em hex.
export function cloudinarySignature(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

// O browser envia o arquivo direto ao Cloudinary; o segredo nunca sai do servidor.
export function signUpload(credentials: CloudinaryCredentials, timestamp: number): SignedUpload {
  const params = { timestamp, folder: FOLDER, allowed_formats: ALLOWED_FORMATS };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
    fields: {
      api_key: credentials.apiKey,
      timestamp: String(timestamp),
      folder: FOLDER,
      allowed_formats: ALLOWED_FORMATS,
      signature: cloudinarySignature(params, credentials.apiSecret),
    },
  };
}
