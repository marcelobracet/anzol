import { describe, expect, it } from "vitest";
import type { Offer } from "@/features/quiz/document/schema";
import { activePrice, buildCheckoutUrl, TRACKING_PARAMS } from "./checkout-url";

const NOW = new Date("2026-11-04T12:00:00Z");
const offer: Offer = {
  id: "offer_main",
  provider: "hotmart",
  fullPriceUrl: "https://pay.hotmart.com/ABC123?checkoutMode=10",
  promo: { url: "https://pay.hotmart.com/ABC123?off=promo&utm_source=checkout", expiresAt: "2026-11-05T00:00:00Z" },
};
const params = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe("activePrice", () => {
  it("usa a promo enquanto não expira e o preço cheio depois", () => {
    expect(activePrice(offer, NOW)).toBe("promo");
    expect(activePrice(offer, new Date("2026-11-05T00:00:00Z"))).toBe("full");
    expect(activePrice({ ...offer, promo: undefined }, NOW)).toBe("full");
  });
});

describe("buildCheckoutUrl", () => {
  it("UTMs da URL do quiz sobrescrevem as do checkout e mantém o resto", () => {
    const url = buildCheckoutUrl(offer, { now: NOW, pageSearch: "?utm_source=fb&utm_campaign=c1&utm_content=ad9" });
    expect(new URL(url).pathname).toBe("/ABC123");
    expect(params(url)).toEqual({ off: "promo", utm_source: "fb", utm_campaign: "c1", utm_content: "ad9" });
  });

  it("repassa src e sck (rastreamento da Hotmart)", () => {
    const url = buildCheckoutUrl(offer, { now: NOW, pageSearch: "src=story&sck=abc" });
    expect(params(url)).toMatchObject({ src: "story", sck: "abc" });
  });

  it("não vaza parâmetros que não são de rastreamento", () => {
    const url = buildCheckoutUrl(offer, { now: NOW, pageSearch: "?fbclid=XYZ&email=a@b.com&utm_medium=cpc" });
    expect(params(url)).toEqual({ off: "promo", utm_source: "checkout", utm_medium: "cpc" });
  });

  it("ignora valores vazios e mantém os do checkout", () => {
    const url = buildCheckoutUrl(offer, { now: NOW, pageSearch: "?utm_source=" });
    expect(params(url).utm_source).toBe("checkout");
  });

  it("sem UTMs devolve a URL da oferta ativa", () => {
    expect(buildCheckoutUrl(offer, { now: new Date("2027-01-01T00:00:00Z"), pageSearch: "" })).toBe(offer.fullPriceUrl);
  });

  it("corta valores longos demais", () => {
    const url = buildCheckoutUrl(offer, { now: NOW, pageSearch: `utm_term=${"x".repeat(500)}` });
    expect(params(url).utm_term).toHaveLength(200);
  });

  it("lista os parâmetros repassados", () => {
    expect(TRACKING_PARAMS).toEqual(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "src", "sck"]);
  });
});
