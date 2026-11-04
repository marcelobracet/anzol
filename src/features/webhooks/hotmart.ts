import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

export type PurchaseStatus = "approved" | "refunded" | "chargeback" | "canceled";
export type ParsedPurchase = {
  orderId: string;
  productId: string;
  status: PurchaseStatus;
  firstName: string | null;
  city: string | null;
  country: string | null;
  amount: number | null;
  currency: string | null;
  createdAt: string;
};
export type PurchaseRecord = ParsedPurchase & { quizId: string | null };

const STATUS_BY_EVENT: Record<string, PurchaseStatus> = {
  PURCHASE_APPROVED: "approved",
  PURCHASE_COMPLETE: "approved",
  PURCHASE_REFUNDED: "refunded",
  PURCHASE_CHARGEBACK: "chargeback",
  PURCHASE_CANCELED: "canceled",
};

export function verifyHottok(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Webhook v2 da Hotmart. Só os campos usados; e-mail, documento e sobrenome nunca são lidos.
const Payload = z.object({
  event: z.string(),
  data: z.object({
    product: z.object({ id: z.union([z.number(), z.string()]) }),
    buyer: z
      .object({
        name: z.string().optional(),
        address: z.object({ city: z.string().optional(), country_iso: z.string().length(2).optional() }).optional(),
      })
      .optional(),
    purchase: z.object({
      transaction: z.string().min(1).max(64),
      approved_date: z.number().optional(),
      order_date: z.number().optional(),
      price: z.object({ value: z.number().optional(), currency_value: z.string().max(3).optional() }).optional(),
    }),
  }),
});

const firstName = (name?: string) => {
  const word = name?.trim().split(/\s+/)[0];
  return word ? word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase() : null;
};

export function parseHotmartEvent(
  raw: unknown,
): { kind: "purchase"; purchase: ParsedPurchase } | { kind: "ignored" } | { kind: "invalid" } {
  const eventName = (raw as { event?: unknown } | null)?.event;
  if (typeof eventName === "string" && !(eventName in STATUS_BY_EVENT)) return { kind: "ignored" };
  const parsed = Payload.safeParse(raw);
  if (!parsed.success) return { kind: "invalid" };
  const { data } = parsed.data;
  const when = data.purchase.approved_date ?? data.purchase.order_date ?? Date.now();
  return {
    kind: "purchase",
    purchase: {
      orderId: data.purchase.transaction,
      productId: String(data.product.id),
      status: STATUS_BY_EVENT[parsed.data.event],
      firstName: firstName(data.buyer?.name),
      city: data.buyer?.address?.city?.trim().slice(0, 80) || null,
      country: data.buyer?.address?.country_iso?.toUpperCase() ?? null,
      amount: data.purchase.price?.value ?? null,
      currency: data.purchase.price?.currency_value ?? null,
      createdAt: new Date(when).toISOString(),
    },
  };
}

type Deps = {
  secret: string;
  findQuizByProduct: (productId: string) => Promise<string | null>;
  /** Insere ou, se o order_id já existe, atualiza só o status. */
  upsertPurchase: (purchase: PurchaseRecord) => Promise<void>;
  revalidate: (quizId: string) => void;
};

export function createHotmartHandler(deps: Deps) {
  return {
    async handle({ hottok, body }: { hottok: string | null; body: unknown }): Promise<{ status: 200 | 400 | 401 }> {
      if (!verifyHottok(hottok, deps.secret)) return { status: 401 };
      const parsed = parseHotmartEvent(body);
      if (parsed.kind === "invalid") return { status: 400 };
      if (parsed.kind === "ignored") return { status: 200 };
      const quizId = await deps.findQuizByProduct(parsed.purchase.productId);
      await deps.upsertPurchase({ ...parsed.purchase, quizId });
      if (quizId) deps.revalidate(quizId);
      return { status: 200 };
    },
  };
}
