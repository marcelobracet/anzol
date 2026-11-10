import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, Theme } from "@/features/quiz/document/schema";
import { VslStep } from "@/features/steps/vsl/schema";
import { backgroundStyle, bannerStyle, pauseOverlayStyle } from "./page-style";

const vsl = (extra: object = {}) =>
  VslStep.parse({ type: "vsl", id: "vsl1", name: "VSL", cta: { label: "Comprar", showAt: 60, offerId: "offer1" }, ...extra });

describe("Theme.background", () => {
  it("documentos antigos, sem fundo, continuam válidos", () => {
    expect(Theme.safeParse(DEFAULT_THEME).success).toBe(true);
  });

  it("aplica defaults ao fundo", () => {
    const theme = Theme.parse({ ...DEFAULT_THEME, background: { pattern: "grid" } });
    expect(theme.background).toEqual({ pattern: "grid", glow: false, imageOverlay: 40 });
  });

  it("recusa padrão desconhecido e véu fora de 0 a 90", () => {
    expect(Theme.safeParse({ ...DEFAULT_THEME, background: { pattern: "zebra" } }).success).toBe(false);
    expect(Theme.safeParse({ ...DEFAULT_THEME, background: { imageOverlay: 95 } }).success).toBe(false);
  });
});

describe("backgroundStyle", () => {
  it("sem fundo configurado, só a cor do tema", () => {
    expect(backgroundStyle(undefined)).toEqual({ backgroundColor: "var(--q-bg)" });
  });

  it("quadriculado usa a cor do texto bem clara, em duas camadas", () => {
    const style = backgroundStyle({ pattern: "grid", glow: false, imageOverlay: 40 });
    expect(style.backgroundImage).toBe(
      "linear-gradient(var(--q-pattern) 1px, transparent 1px), linear-gradient(90deg, var(--q-pattern) 1px, transparent 1px)",
    );
    expect(style.backgroundSize).toBe("32px 32px, 32px 32px");
    expect(style["--q-pattern"]).toBe("color-mix(in srgb, var(--q-text) 7%, transparent)");
  });

  it("empilha padrão, brilho, véu e imagem nessa ordem", () => {
    const style = backgroundStyle({ pattern: "dots", glow: true, imageOverlay: 60 }, "https://img/bg.jpg");
    const layers = String(style.backgroundImage).split(/,\s(?=(?:radial|linear)-gradient|url)/);
    expect(layers[0]).toMatch(/^radial-gradient\(var\(--q-pattern\)/);
    expect(layers.slice(1, 3).every((l) => l.startsWith("radial-gradient(circle at"))).toBe(true);
    expect(layers[3]).toBe(
      "linear-gradient(color-mix(in srgb, var(--q-bg) 60%, transparent), color-mix(in srgb, var(--q-bg) 60%, transparent))",
    );
    expect(layers[4]).toBe('url("https://img/bg.jpg")');
    expect(String(style.backgroundSize).split(", ")).toEqual(["18px 18px", "cover", "cover", "cover", "cover"]);
  });

  it("sem imagem, o véu não entra", () => {
    const style = backgroundStyle({ pattern: "none", glow: false, imageOverlay: 40 });
    expect(style.backgroundImage).toBeUndefined();
  });
});

describe("VslStep: faixa e tela de pausa", () => {
  it("passos antigos ganham os defaults", () => {
    const step = vsl();
    expect(step.bannerStyle).toEqual({ icon: "none", animation: "pulse" });
    expect(step.pauseScreen).toEqual({ opacity: 55, blur: false });
  });

  it("recusa animação desconhecida", () => {
    expect(VslStep.safeParse({ ...vsl(), bannerStyle: { animation: "dance" } }).success).toBe(false);
  });
});

describe("bannerStyle", () => {
  it("sem cores, usa o destaque do tema e o contraste automático", () => {
    expect(bannerStyle(vsl().bannerStyle)).toEqual({ background: "var(--q-accent)", color: "var(--q-on-accent)" });
  });

  it("cor de fundo própria ganha texto legível automático; texto próprio prevalece", () => {
    expect(bannerStyle({ icon: "none", animation: "none", background: "#E95E49" })).toEqual({ background: "#E95E49", color: "#000000" });
    expect(bannerStyle({ icon: "none", animation: "none", background: "#E95E49", text: "#FFFFFF" }).color).toBe("#FFFFFF");
  });
});

describe("pauseOverlayStyle", () => {
  it("padrão: preto a 55% com texto branco", () => {
    expect(pauseOverlayStyle(vsl().pauseScreen)).toEqual({ background: "rgba(0, 0, 0, 0.55)", color: "#FFFFFF" });
  });

  it("cor, opacidade, texto e desfoque personalizados", () => {
    expect(pauseOverlayStyle({ overlay: "#9ACD32", opacity: 100, text: "#3B2314", blur: true })).toEqual({
      background: "rgba(154, 205, 50, 1)",
      color: "#3B2314",
      backdropFilter: "blur(6px)",
    });
  });

  it("sem cor de texto, escolhe a legível sobre a cor do véu", () => {
    expect(pauseOverlayStyle({ overlay: "#FFFFFF", opacity: 90, blur: false }).color).toBe("#000000");
  });
});
