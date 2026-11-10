"use client";

import type { PageBackground, QuizDocument, Theme } from "@/features/quiz/document/schema";
import { CheckboxField, ColorField, NumberField, SelectField, TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { errorAt, type EditorIssue } from "../document-ops";
import { applyPreset, THEME_PRESETS } from "../theme-presets";

const PATTERNS = [
  { value: "none", label: "Liso" },
  { value: "grid", label: "Quadriculado" },
  { value: "dots", label: "Pontinhos" },
] as const;

const NO_BACKGROUND: PageBackground = { pattern: "none", glow: false, imageOverlay: 40 };

const MODES = [
  { value: "quiz", label: "Quiz + VSL" },
  { value: "vsl", label: "Só VSL" },
] as const;

const FONTS = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "poppins", label: "Poppins" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "lora", label: "Lora (serifa)" },
] as const;

const COLORS: { key: keyof Theme["colors"]; label: string }[] = [
  { key: "primary", label: "Primária (botões)" },
  { key: "background", label: "Fundo" },
  { key: "surface", label: "Superfície (opções)" },
  { key: "text", label: "Texto" },
  { key: "accent", label: "Destaque" },
];

type Props = {
  theme: Theme;
  settings: QuizDocument["settings"];
  onTheme: (theme: Theme) => void;
  onSettings: (settings: QuizDocument["settings"]) => void;
  tracking: QuizDocument["tracking"];
  onTracking: (tracking: QuizDocument["tracking"]) => void;
  issues?: EditorIssue[];
  cloudName?: string;
};

export function ThemeForm({ theme, settings, onTheme, onSettings, tracking, onTracking, issues, cloudName }: Props) {
  const background = theme.background ?? NO_BACKGROUND;
  const setBackground = (patch: Partial<PageBackground>) => onTheme({ ...theme, background: { ...background, ...patch } });
  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Modelos prontos</p>
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onTheme(applyPreset(theme, preset.id))}
            className="flex items-center gap-2 rounded-md border p-1.5 text-left text-xs hover:bg-muted"
          >
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded border"
              style={{ background: preset.colors.background, backgroundImage: swatchPattern(preset), backgroundSize: "6px 6px" }}
            >
              <span className="size-3 rounded-full" style={{ background: preset.colors.primary }} />
            </span>
            {preset.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Troca cores e fundo. Logo, fonte e imagem de fundo ficam como estão.</p>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tema</p>
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map(({ key, label }) => (
          <ColorField
            key={key}
            label={label}
            value={theme.colors[key]}
            error={errorAt(issues, "theme", "colors", key)}
            onChange={(value) => onTheme({ ...theme, colors: { ...theme.colors, [key]: value } })}
          />
        ))}
      </div>
      <SelectField label="Fonte" value={theme.font} options={FONTS} onChange={(font) => onTheme({ ...theme, font })} />
      <NumberField label="Arredondamento (px)" min={0} max={32} value={theme.radius} onChange={(r) => onTheme({ ...theme, radius: r ?? 0 })} />
      <MediaField
        label="Logo"
        value={theme.logo}
        allowAnimated={false}
        cloudName={cloudName}
        onChange={(logo) => onTheme({ ...theme, logo: logo?.kind === "image" ? logo : undefined })}
      />
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Fundo da página</p>
      <SelectField label="Desenho" value={background.pattern} options={PATTERNS} onChange={(pattern) => setBackground({ pattern })} />
      <CheckboxField label="Brilho suave nos cantos" checked={background.glow} onChange={(glow) => setBackground({ glow })} />
      <MediaField
        label="Imagem de fundo (opcional)"
        value={background.image}
        allowAnimated={false}
        cloudName={cloudName}
        onChange={(image) => setBackground({ image: image?.kind === "image" ? image : undefined })}
      />
      {background.image && (
        <NumberField
          label="Véu sobre a imagem (%)"
          hint="Cor de fundo por cima da imagem, para o texto continuar legível. 0 = imagem pura."
          min={0}
          max={90}
          step={5}
          value={background.imageOverlay}
          onChange={(v) => setBackground({ imageOverlay: v ?? 0 })}
        />
      )}
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Formato da página</p>
      <SelectField
        label="O que o visitante vê"
        value={settings.mode}
        options={MODES}
        onChange={(mode) => onSettings({ ...settings, mode })}
      />
      {settings.mode === "vsl" && (
        <p className="text-xs text-muted-foreground">Só o primeiro step VSL aparece. Os outros steps ficam guardados para voltar ao modo quiz.</p>
      )}
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Navegação</p>
      <CheckboxField label="Mostrar barra de progresso" checked={settings.showProgress} onChange={(showProgress) => onSettings({ ...settings, showProgress })} />
      <CheckboxField label="Permitir voltar" checked={settings.allowBack} onChange={(allowBack) => onSettings({ ...settings, allowBack })} />
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Rastreamento</p>
      <TextField
        label="Meta Pixel ID"
        hint="Pixel no navegador e Conversions API no servidor, com o mesmo event_id. Na UE, só após consentimento."
        maxLength={20}
        value={tracking.metaPixelId}
        onChange={(v) => onTracking({ ...tracking, metaPixelId: v.trim() || undefined })}
        error={errorAt(issues, "tracking", "metaPixelId")}
      />
    </div>
  );
}

function swatchPattern(preset: (typeof THEME_PRESETS)[number]): string | undefined {
  const line = `${preset.colors.text}22`;
  if (preset.background.pattern === "grid") return `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;
  if (preset.background.pattern === "dots") return `radial-gradient(${line} 1px, transparent 1px)`;
  return undefined;
}
