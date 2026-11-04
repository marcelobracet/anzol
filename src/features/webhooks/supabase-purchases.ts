import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PurchaseRecord } from "./hotmart";

export function createSupabasePurchaseStore(db: SupabaseClient) {
  return {
    async findQuizByProduct(productId: string): Promise<string | null> {
      const { data, error } = await db.rpc("quiz_for_product", { p_product_id: productId });
      if (error) throw new Error(`Supabase quiz_for_product: ${error.message}`);
      return (data as string | null) ?? null;
    },
    async upsertPurchase(p: PurchaseRecord): Promise<void> {
      const { error } = await db.rpc("record_purchase", {
        p_order_id: p.orderId,
        p_quiz_id: p.quizId,
        p_product_id: p.productId,
        p_status: p.status,
        p_first_name: p.firstName,
        p_city: p.city,
        p_country: p.country,
        p_amount: p.amount,
        p_currency: p.currency,
        p_created_at: p.createdAt,
      });
      if (error) throw new Error(`Supabase record_purchase: ${error.message}`);
    },
  };
}
