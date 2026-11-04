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
