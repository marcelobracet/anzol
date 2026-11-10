import type { CSSProperties } from "react";
import type { PageBackground } from "@/features/quiz/document/schema";
import type { BannerStyle, PauseScreen } from "@/features/steps/vsl/schema";
import { readableOn } from "./theme";

type Layer = { image: string; size: string };
type StyleWithVars = CSSProperties & Record<`--q-${string}`, string>;

const PATTERN_COLOR = "color-mix(in srgb, var(--q-text) 7%, transparent)";
const veil = (percent: number) => `color-mix(in srgb, var(--q-bg) ${percent}%, transparent)`;

const PATTERNS: Record<PageBackground["pattern"], Layer[]> = {
  none: [],
  grid: [
    { image: "linear-gradient(var(--q-pattern) 1px, transparent 1px)", size: "32px 32px" },
    { image: "linear-gradient(90deg, var(--q-pattern) 1px, transparent 1px)", size: "32px 32px" },
  ],
  dots: [{ image: "radial-gradient(var(--q-pattern) 1.2px, transparent 1.2px)", size: "18px 18px" }],
};

const GLOW: Layer[] = [
  { image: "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--q-accent) 22%, transparent), transparent 45%)", size: "cover" },
  { image: "radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--q-primary) 16%, transparent), transparent 45%)", size: "cover" },
];

// Camadas de cima para baixo: padrão, brilho, véu da cor de fundo e imagem.
export function backgroundStyle(bg: PageBackground | undefined, imageUrl?: string): StyleWithVars {
  const base: StyleWithVars = { backgroundColor: "var(--q-bg)" };
  if (!bg) return base;
  const layers: Layer[] = [
    ...PATTERNS[bg.pattern],
    ...(bg.glow ? GLOW : []),
    ...(imageUrl
      ? [
          { image: `linear-gradient(${veil(bg.imageOverlay)}, ${veil(bg.imageOverlay)})`, size: "cover" },
          { image: `url("${imageUrl}")`, size: "cover" },
        ]
      : []),
  ];
  if (layers.length === 0) return base;
  return {
    ...base,
    "--q-pattern": PATTERN_COLOR,
    backgroundImage: layers.map((l) => l.image).join(", "),
    backgroundSize: layers.map((l) => l.size).join(", "),
    backgroundPosition: "center",
  };
}

export function bannerStyle(style: BannerStyle): { background: string; color: string } {
  if (!style.background) return { background: "var(--q-accent)", color: style.text ?? "var(--q-on-accent)" };
  return { background: style.background, color: style.text ?? readableOn(style.background) };
}

const rgba = (hex: string, alpha: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${alpha})`;

export function pauseOverlayStyle(screen: PauseScreen): CSSProperties {
  const overlay = screen.overlay ?? "#000000";
  return {
    background: rgba(overlay, screen.opacity / 100),
    color: screen.text ?? readableOn(overlay),
    ...(screen.blur ? { backdropFilter: "blur(6px)" } : {}),
  };
}
