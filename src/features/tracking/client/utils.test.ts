import { describe, expect, it } from "vitest";
import { fbcFromClick, initialConsent, pixelAllowed, readCookie, readUtm } from "./utils";

describe("readUtm", () => {
  it("pega só parâmetros de rastreamento, cortados", () => {
    expect(readUtm("?utm_source=fb&utm_campaign=c1&fbclid=x&email=a")).toEqual({ utm_source: "fb", utm_campaign: "c1" });
    expect(readUtm(`?utm_term=${"x".repeat(300)}`).utm_term).toHaveLength(200);
  });
});

describe("readCookie", () => {
  it("lê pelo nome exato", () => {
    expect(readCookie("a=1; _fbp=fb.1.2.3; _fbc=fb.1.9.abc", "_fbp")).toBe("fb.1.2.3");
    expect(readCookie("x_fbp=1", "_fbp")).toBeUndefined();
  });
});

describe("fbcFromClick", () => {
  it("monta fbc no formato da Meta a partir do fbclid", () => {
    expect(fbcFromClick("?fbclid=AbC123", 1700000000000)).toBe("fb.1.1700000000000.AbC123");
    expect(fbcFromClick("?utm_source=fb", 1)).toBeUndefined();
  });
});

describe("consentimento", () => {
  it("decide o estado inicial pelo locale, geo e escolha salva", () => {
    expect(initialConsent({ euLocale: false, euVisitor: false, saved: null })).toBe("not_required");
    expect(initialConsent({ euLocale: true, euVisitor: false, saved: null })).toBe("ask");
    expect(initialConsent({ euLocale: false, euVisitor: true, saved: "granted" })).toBe("granted");
    expect(initialConsent({ euLocale: true, euVisitor: true, saved: "denied" })).toBe("denied");
  });

  it("Pixel só roda sem exigência ou com aceite", () => {
    expect(pixelAllowed("not_required")).toBe(true);
    expect(pixelAllowed("granted")).toBe(true);
    for (const s of ["ask", "denied", "pending"] as const) expect(pixelAllowed(s)).toBe(false);
  });
});
