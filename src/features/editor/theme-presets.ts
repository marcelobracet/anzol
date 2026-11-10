import type { Theme } from "@/features/quiz/document/schema";

export type ThemePreset = { id: string; label: string } & Pick<Theme, "colors"> & { background: Pick<NonNullable<Theme["background"]>, "pattern" | "glow"> };

// Pontos de partida de um clique: trocam cores e padrão do fundo, mantêm logo, fonte e imagem.
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "grid-light",
    label: "Creme quadriculado",
    colors: { primary: "#18B957", background: "#FFFAF2", surface: "#FFFFFF", text: "#3B2314", accent: "#F47B20" },
    background: { pattern: "grid", glow: true },
  },
  {
    id: "grid-dark",
    label: "Escuro quadriculado",
    colors: { primary: "#22C55E", background: "#0F1115", surface: "#1A1D24", text: "#F4F4F5", accent: "#F59E0B" },
    background: { pattern: "grid", glow: true },
  },
  {
    id: "dots-rose",
    label: "Rosa com pontos",
    colors: { primary: "#E11D74", background: "#FFF5F7", surface: "#FFFFFF", text: "#4A1D2E", accent: "#E95E49" },
    background: { pattern: "dots", glow: false },
  },
  {
    id: "dots-navy",
    label: "Azul-noite com pontos",
    colors: { primary: "#38BDF8", background: "#0B1B33", surface: "#132A4A", text: "#E6EEF8", accent: "#FACC15" },
    background: { pattern: "dots", glow: true },
  },
  {
    id: "clean",
    label: "Branco liso",
    colors: { primary: "#2563EB", background: "#FFFFFF", surface: "#F4F4F5", text: "#18181B", accent: "#F59E0B" },
    background: { pattern: "none", glow: false },
  },
];

export function applyPreset(theme: Theme, id: string): Theme {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return theme;
  const current = theme.background ?? { pattern: "none" as const, glow: false, imageOverlay: 40 };
  return { ...theme, colors: preset.colors, background: { ...current, ...preset.background } };
}
