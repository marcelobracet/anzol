import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHotmartHandler, parseHotmartEvent, verifyHottok, type PurchaseRecord } from "./hotmart";

const SECRET = "hottok-super-secreto";
const QUIZ = "6f1c2a3e-1111-4222-8333-944455556666";

const payload = (event = "PURCHASE_APPROVED", over: Record<string, unknown> = {}) => ({
  id: "evt-1",
  event,
  version: "2.0.0",
  data: {
    product: { id: 4242, name: "Curso" },
    buyer: {
      name: "ana maria souza",
      email: "ana@mail.com",
      document: "12345678900",
      address: { city: "Bogotá", country: "Colombia", country_iso: "CO" },
    },
    purchase: {
      transaction: "HP123456",
      status: "APPROVED",
      approved_date: 1_793_800_000_000,
      price: { value: 97.5, currency_value: "COP" },
      ...over,
    },
  },
});

describe("verifyHottok", () => {
  it("aceita só o token exato", () => {
    expect(verifyHottok(SECRET, SECRET)).toBe(true);
    expect(verifyHottok("errado", SECRET)).toBe(false);
    expect(verifyHottok(null, SECRET)).toBe(false);
    expect(verifyHottok(`${SECRET}x`, SECRET)).toBe(false);
  });
});

describe("parseHotmartEvent", () => {
  it("extrai só o mínimo: primeiro nome, cidade, país, valor", () => {
    const parsed = parseHotmartEvent(payload());
    expect(parsed).toEqual({
      kind: "purchase",
      purchase: {
        orderId: "HP123456",
        productId: "4242",
        status: "approved",
        firstName: "Ana",
        city: "Bogotá",
        country: "CO",
        amount: 97.5,
        currency: "COP",
        createdAt: new Date(1_793_800_000_000).toISOString(),
      },
    });
    expect(JSON.stringify(parsed)).not.toMatch(/ana@mail|12345678900|souza/i);
  });

  it.each([
    ["PURCHASE_REFUNDED", "refunded"],
    ["PURCHASE_CHARGEBACK", "chargeback"],
    ["PURCHASE_CANCELED", "canceled"],
    ["PURCHASE_COMPLETE", "approved"],
  ])("%s vira status %s", (event, status) => {
    const parsed = parseHotmartEvent(payload(event));
    expect(parsed.kind === "purchase" && parsed.purchase.status).toBe(status);
  });

  it("eventos sem interesse são ignorados e payload quebrado é inválido", () => {
    expect(parseHotmartEvent(payload("PURCHASE_BILLET_PRINTED"))).toEqual({ kind: "ignored" });
    expect(parseHotmartEvent({ event: "PURCHASE_APPROVED", data: {} })).toEqual({ kind: "invalid" });
  });
});

describe("handler", () => {
  let rows: Map<string, PurchaseRecord>;
  let revalidate: ReturnType<typeof vi.fn>;
  let findQuiz: ReturnType<typeof vi.fn>;
  const handler = () =>
    createHotmartHandler({
      secret: SECRET,
      findQuizByProduct: findQuiz,
      upsertPurchase: async (p) => {
        const current = rows.get(p.orderId);
        rows.set(p.orderId, current ? { ...current, status: p.status } : p);
      },
      revalidate,
    });

  beforeEach(() => {
    rows = new Map();
    revalidate = vi.fn();
    findQuiz = vi.fn().mockResolvedValue(QUIZ);
  });

  it("token errado: 401 e nada gravado", async () => {
    expect(await handler().handle({ hottok: "x", body: payload() })).toEqual({ status: 401 });
    expect(rows.size).toBe(0);
  });

  it("grava a compra ligada ao quiz pelo produto e invalida o toast", async () => {
    expect(await handler().handle({ hottok: SECRET, body: payload() })).toEqual({ status: 200 });
    expect(findQuiz).toHaveBeenCalledWith("4242");
    expect(rows.get("HP123456")).toMatchObject({ quizId: QUIZ, status: "approved", firstName: "Ana" });
    expect(revalidate).toHaveBeenCalledWith(QUIZ);
  });

  it("idempotente por order_id: reenvio não duplica e reembolso só muda o status", async () => {
    const h = handler();
    await h.handle({ hottok: SECRET, body: payload() });
    await h.handle({ hottok: SECRET, body: payload() });
    await h.handle({ hottok: SECRET, body: payload("PURCHASE_REFUNDED", { status: "REFUNDED" }) });
    expect(rows.size).toBe(1);
    expect(rows.get("HP123456")).toMatchObject({ status: "refunded", firstName: "Ana" });
  });

  it("produto sem quiz ainda grava (quiz nulo)", async () => {
    findQuiz.mockResolvedValue(null);
    await handler().handle({ hottok: SECRET, body: payload() });
    expect(rows.get("HP123456")?.quizId).toBeNull();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("evento ignorado responde 200 sem gravar; inválido responde 400", async () => {
    expect(await handler().handle({ hottok: SECRET, body: payload("PURCHASE_DELAYED") })).toEqual({ status: 200 });
    expect(await handler().handle({ hottok: SECRET, body: { nada: 1 } })).toEqual({ status: 400 });
    expect(rows.size).toBe(0);
  });
});
