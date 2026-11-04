import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { databaseEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

// Service role: só no servidor. Sem Supabase Auth; quem autentica é o Cloudflare Access.
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const env = databaseEnv();
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
