import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";

export const purchasesTag = (quizId: string) => `purchases:${quizId}`;

// Compras aprovadas do quiz na janela. Cache curto; o webhook invalida a tag ao registrar compra.
export async function loadRecentPurchaseRows(quizId: string, hours: number): Promise<unknown[]> {
  "use cache";
  cacheTag(purchasesTag(quizId));
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });

  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  if (devMemoryEnabled()) {
    return devMemoryStore()
      .purchases.rows.filter((p) => p.quizId === quizId && p.status === "approved" && p.createdAt >= since)
      .map((p) => ({ first_name: p.firstName, city: p.city, country: p.country, created_at: p.createdAt }))
      .reverse()
      .slice(0, 10);
  }
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
