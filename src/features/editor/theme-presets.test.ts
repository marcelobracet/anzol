import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, Theme } from "@/features/quiz/document/schema";
import { applyPreset, THEME_PRESETS } from "./theme-presets";

describe("THEME_PRESETS", () => {
  it("todo preset é um tema válido", () => {
    for (const preset of THEME_PRESETS) {
      expect(Theme.safeParse(applyPreset(DEFAULT_THEME, preset.id)).success, preset.id).toBe(true);
    }
  });

  it("tem ids únicos e inclui quadriculado claro e escuro", () => {
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["grid-light", "grid-dark"]));
  });
});

describe("applyPreset", () => {
  const logo = { kind: "image" as const, publicId: "logo", width: 200, height: 80, alt: "" };
  const image = { kind: "image" as const, publicId: "bg", width: 1600, height: 900, alt: "" };

  it("troca cores e fundo, mantém logo, fonte, arredondamento e imagem de fundo", () => {
    const theme = { ...DEFAULT_THEME, logo, font: "lora" as const, radius: 4, background: { pattern: "none" as const, glow: false, imageOverlay: 70, image } };
    const next = applyPreset(theme, "grid-dark");
    expect(next.logo).toBe(logo);
    expect(next.font).toBe("lora");
    expect(next.radius).toBe(4);
    expect(next.background).toMatchObject({ pattern: "grid", image, imageOverlay: 70 });
    expect(next.colors.background).not.toBe(DEFAULT_THEME.colors.background);
  });

  it("id desconhecido devolve o tema como está", () => {
    expect(applyPreset(DEFAULT_THEME, "nao-existe")).toBe(DEFAULT_THEME);
  });
});
