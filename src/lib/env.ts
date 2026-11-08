import { z } from "zod";

const csv = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

const AuthEnvSchema = z.object({
  CF_ACCESS_TEAM_DOMAIN: z.url(), // ex.: https://meutime.cloudflareaccess.com
  CF_ACCESS_AUD: z.string().min(10),
  STUDIO_ALLOWED_EMAILS: csv.refine((list) => list.length > 0, "Defina ao menos um e-mail"),
  // Só tem efeito fora de produção (ver resolveDevBypass).
  AUTH_DEV_BYPASS_EMAIL: z.email().optional(),
});

const RoutingEnvSchema = z.object({
  STUDIO_HOST: z.string().min(3).transform((v) => v.toLowerCase()),
  BLOCKED_HOSTS: csv,
});

const DatabaseEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export type AuthEnv = z.infer<typeof AuthEnvSchema>;
export type RoutingEnv = z.infer<typeof RoutingEnvSchema>;
export type DatabaseEnv = z.infer<typeof DatabaseEnvSchema>;

function parse<T extends z.ZodType>(schema: T, group: string): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente inválidas (${group}): ${fields}`);
  }
  return result.data;
}

// Lido sob demanda para o build não exigir segredos.
export const authEnv = (): AuthEnv => parse(AuthEnvSchema, "auth");
export const routingEnv = (): RoutingEnv => parse(RoutingEnvSchema, "routing");
export const databaseEnv = (): DatabaseEnv => parse(DatabaseEnvSchema, "database");

const MediaEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9_-]+$/i).optional(),
  // Pull zone da biblioteca do Bunny Stream, ex.: vz-abc123.b-cdn.net
  BUNNY_CDN_HOST: z.string().regex(/^[a-z0-9.-]+$/i).optional(),
});
export type MediaEnv = z.infer<typeof MediaEnvSchema>;
export const mediaEnv = (): MediaEnv => parse(MediaEnvSchema, "media");

const CloudinaryUploadEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9_-]+$/i),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});
export const cloudinaryUploadEnv = () => parse(CloudinaryUploadEnvSchema, "cloudinary");

// Vídeos da VSL no Cloudflare R2 (API S3). As chaves ficam só no servidor.
const R2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().regex(/^[a-f0-9]{32}$/i, "Account ID do Cloudflare"),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
  R2_PUBLIC_BASE_URL: z.url({ protocol: /^https$/ }),
});
export const r2Env = () => parse(R2EnvSchema, "r2");

const VercelEnvSchema = z.object({
  VERCEL_API_TOKEN: z.string().min(1),
  VERCEL_PROJECT_ID: z.string().min(1),
  VERCEL_TEAM_ID: z.string().min(1).optional(),
});
export const vercelApiEnv = () => parse(VercelEnvSchema, "vercel");

const TrackingEnvSchema = z.object({
  // Token da Conversions API: só no servidor, nunca em NEXT_PUBLIC_*.
  META_CAPI_TOKEN: z.string().min(20).optional(),
});
export const trackingEnv = () => parse(TrackingEnvSchema, "tracking");

const WebhookEnvSchema = z.object({
  HOTMART_HOTTOK: z.string().min(10),
});
export const webhookEnv = () => parse(WebhookEnvSchema, "webhook");
