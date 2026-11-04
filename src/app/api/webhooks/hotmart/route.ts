import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { purchasesTag } from "@/features/purchases/load-recent";
import { createHotmartHandler } from "@/features/webhooks/hotmart";
import { createSupabasePurchaseStore } from "@/features/webhooks/supabase-purchases";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { webhookEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 64 * 1024;

// Passa pelo Cloudflare Access (bypass só em /api/webhooks/*); a autenticação é o hottok.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ success: false }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
  }

  try {
    const store = devMemoryEnabled() ? devMemoryStore().purchases : createSupabasePurchaseStore(supabaseAdmin());
    const handler = createHotmartHandler({
      secret: webhookEnv().HOTMART_HOTTOK,
      findQuizByProduct: store.findQuizByProduct,
      upsertPurchase: store.upsertPurchase,
      revalidate: (quizId) => revalidateTag(purchasesTag(quizId), { expire: 0 }),
    });
    const { status } = await handler.handle({ hottok: request.headers.get("x-hotmart-hottok"), body });
    return NextResponse.json({ success: status === 200 }, { status });
  } catch (error) {
    // 500 faz a Hotmart reenviar; a gravação é idempotente.
    console.error("[webhook:hotmart] falha ao processar", { error: String(error) });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
