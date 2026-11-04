import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { devMemoryEnabled } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";

export const purchasesTag = (quizId: string) => `purchases:${quizId}`;

// Compras aprovadas do quiz na janela. Cache curto; o webhook invalida a tag ao registrar compra.
export async function loadRecentPurchaseRows(quizId: string, hours: number): Promise<unknown[]> {
  "use cache";
  cacheTag(purchasesTag(quizId));
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });

  if (devMemoryEnabled()) return [];
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data, error } = await supabaseAdmin()
    .from("purchases")
    .select("first_name, city, country, created_at")
    .eq("quiz_id", quizId)
    .eq("status", "approved")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(`Supabase purchases: ${error.message}`);
  return data ?? [];
}
