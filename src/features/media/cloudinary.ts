const CLOUD_NAME = /^[a-z0-9_-]+$/i;
const BASE = "https://res.cloudinary.com";

function encodePublicId(publicId: string): string {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

function assertParams(cloudName: string, width: number) {
  if (!CLOUD_NAME.test(cloudName)) throw new Error("Cloudinary cloud name inválido");
  if (!Number.isInteger(width) || width <= 0) throw new Error("Largura inválida");
}

export function imageUrl(cloudName: string, publicId: string, width: number): string {
  assertParams(cloudName, width);
  return `${BASE}/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_${width}/${encodePublicId(publicId)}`;
}

// GIF enviado como imagem e entregue como mp4: bem mais leve que o GIF original.
export function animatedUrl(cloudName: string, publicId: string, width: number): string {
  assertParams(cloudName, width);
  return `${BASE}/${cloudName}/image/upload/q_auto,c_limit,w_${width}/${encodePublicId(publicId)}.mp4`;
}
