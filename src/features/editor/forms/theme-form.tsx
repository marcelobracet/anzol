"use client";

import type { QuizDocument, Theme } from "@/features/quiz/document/schema";
import { CheckboxField, ColorField, NumberField, SelectField, TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { errorAt, type EditorIssue } from "../document-ops";

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
  return (
    <div className="grid gap-4">
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
