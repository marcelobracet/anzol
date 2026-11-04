import type { CSSProperties } from "react";
import type { Theme } from "@/features/quiz/document/schema";

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

// Cor de texto (preto ou branco) com mais contraste WCAG sobre o fundo dado.
export function readableOn(hex: string): "#000000" | "#FFFFFF" {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#000000" : "#FFFFFF";
}

export function themeStyle(theme: Theme): CSSProperties & Record<`--q-${string}`, string> {
  const { colors } = theme;
  return {
    "--q-primary": colors.primary,
    "--q-on-primary": readableOn(colors.primary),
    "--q-bg": colors.background,
    "--q-surface": colors.surface,
    "--q-text": colors.text,
    "--q-accent": colors.accent,
    "--q-on-accent": readableOn(colors.accent),
    "--q-radius": `${theme.radius}px`,
  };
}
