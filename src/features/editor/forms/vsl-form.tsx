"use client";

import type { BannerStyle, PauseScreen, VslStep } from "@/features/steps/vsl/schema";
import { DurationField } from "../components/duration-field";
import { CheckboxField, NumberField, OptionalColorField, SelectField, TextField } from "../components/fields";
import { MediaField } from "../components/media-field";
import { VideoField } from "../components/video-field";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";
import { OfferSelect } from "./offer-select";

const ASPECTS = [
  { value: "9:16", label: "Em pé (9:16), ideal para celular" },
  { value: "16:9", label: "Deitado (16:9)" },
] as const;

const ICONS: { value: BannerStyle["icon"]; label: string }[] = [
  { value: "none", label: "Sem ícone" },
  { value: "compass", label: "🧭 Bússola" },
  { value: "clock", label: "⏰ Relógio" },
  { value: "alert", label: "⚠️ Alerta" },
  { value: "flame", label: "🔥 Fogo" },
  { value: "play", label: "▶️ Play" },
  { value: "gift", label: "🎁 Presente" },
  { value: "star", label: "⭐ Estrela" },
  { value: "heart", label: "❤️ Coração" },
  { value: "bell", label: "🔔 Sino" },
];

const ANIMATIONS: { value: BannerStyle["animation"]; label: string }[] = [
  { value: "pulse", label: "Pulsar (cresce e diminui)" },
  { value: "bounce", label: "Pular" },
  { value: "shake", label: "Balançar" },
  { value: "spin", label: "Girar" },
  { value: "blink", label: "Piscar" },
  { value: "none", label: "Parado" },
];

export function VslForm({ step, onChange, issues, offers, quizId, cloudName }: StepFormProps<VslStep>) {
  const set = (patch: Partial<VslStep>) => onChange({ ...step, ...patch });
  const { cta, toast, progressBar, bannerStyle, pauseScreen } = step;
  const setBanner = (patch: Partial<BannerStyle>) => set({ bannerStyle: { ...bannerStyle, ...patch } });
  const setPause = (patch: Partial<PauseScreen>) => set({ pauseScreen: { ...pauseScreen, ...patch } });
  return (
    <div className="grid gap-4">
      <h3 className="text-sm font-semibold">Textos da página</h3>
      <TextField label="Faixa no topo (opcional)" value={step.banner} onChange={(v) => set({ banner: v || undefined })} />
      {step.banner && (
        <div className="grid gap-3 rounded-md border p-3">
          <div className="grid grid-cols-2 gap-2">
            <OptionalColorField label="Fundo da faixa" value={bannerStyle.background} fallback="destaque" onChange={(background) => setBanner({ background })} />
            <OptionalColorField label="Texto da faixa" value={bannerStyle.text} fallback="automático" onChange={(text) => setBanner({ text })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Ícone" value={bannerStyle.icon} options={ICONS} onChange={(icon) => setBanner({ icon })} />
            <SelectField label="Animação do ícone" value={bannerStyle.animation} options={ANIMATIONS} onChange={(animation) => setBanner({ animation })} />
          </div>
          <MediaField
            label="Imagem própria no lugar do ícone (opcional)"
            value={bannerStyle.iconImage}
            allowAnimated={false}
            cloudName={cloudName}
            onChange={(iconImage) => setBanner({ iconImage: iconImage?.kind === "image" ? iconImage : undefined })}
          />
        </div>
      )}
      <TextField label="Headline (opcional)" value={step.headline} multiline onChange={(v) => set({ headline: v || undefined })} />
      <TextField label="Descrição abaixo da headline (opcional)" value={step.subheadline} onChange={(v) => set({ subheadline: v || undefined })} />
      <h3 className="text-sm font-semibold">Vídeo</h3>
      <SelectField label="Formato" value={step.aspect} options={ASPECTS} onChange={(aspect) => set({ aspect })} />
      <VideoField value={step.video} quizId={quizId} onChange={(video) => set({ video })} error={errorAt(issues, "video")} />
      <CheckboxField label="Barra de progresso acelerada" checked={progressBar.enabled} onChange={(enabled) => set({ progressBar: { ...progressBar, enabled } })} />
      {progressBar.enabled && (
        <NumberField
          label="Aceleração (k)"
          hint="1 = real. 3 = chega a 50% com ~20% do vídeo."
          min={1}
          max={10}
          step={0.5}
          value={progressBar.k}
          onChange={(k) => set({ progressBar: { ...progressBar, k: k ?? 1 } })}
          error={errorAt(issues, "progressBar", "k")}
        />
      )}
      <h3 className="text-sm font-semibold">Tela de pausa e retomada</h3>
      <p className="text-xs text-muted-foreground">Aparece quando o visitante pausa e quando volta a um vídeo que já tinha começado.</p>
      <div className="grid grid-cols-2 gap-2">
        <OptionalColorField label="Cor do véu" value={pauseScreen.overlay} fallback="preto" onChange={(overlay) => setPause({ overlay })} />
        <OptionalColorField label="Cor do texto" value={pauseScreen.text} fallback="automática" onChange={(text) => setPause({ text })} />
      </div>
      <NumberField label="Opacidade do véu (%)" hint="100 = cor sólida, como na VTurb." min={0} max={100} step={5} value={pauseScreen.opacity} onChange={(v) => setPause({ opacity: v ?? 0 })} />
      <CheckboxField label="Desfocar o vídeo por trás" checked={pauseScreen.blur} onChange={(blur) => setPause({ blur })} />
      <TextField label="Título (opcional)" placeholder="Padrão: “Você já começou a assistir este vídeo” / “Seu vídeo está pausado”" value={pauseScreen.title} onChange={(v) => setPause({ title: v || undefined })} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Botão continuar" placeholder="Continuar assistindo" value={pauseScreen.continueLabel} onChange={(v) => setPause({ continueLabel: v || undefined })} />
        <TextField label="Botão recomeçar" placeholder="Assistir do início" value={pauseScreen.restartLabel} onChange={(v) => setPause({ restartLabel: v || undefined })} />
      </div>
      <h3 className="text-sm font-semibold">Botão de compra</h3>
      <OfferSelect offers={offers} value={cta.offerId} onChange={(offerId) => set({ cta: { ...cta, offerId } })} />
      <TextField label="Texto do botão" value={cta.label} onChange={(label) => set({ cta: { ...cta, label } })} error={errorAt(issues, "cta", "label")} />
      <DurationField
        label="Aparece aos (tempo de vídeo assistido)"
        value={cta.showAt}
        onChange={(showAt) => set({ cta: { ...cta, showAt } })}
        error={errorAt(issues, "cta", "showAt")}
      />
      <h3 className="text-sm font-semibold">Toast de compras</h3>
      <CheckboxField label="Mostrar compras reais recentes" checked={toast.enabled} onChange={(enabled) => set({ toast: { ...toast, enabled } })} />
      {toast.enabled && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Começa antes do botão (s)"
            min={0}
            value={toast.leadSeconds}
            onChange={(v) => set({ toast: { ...toast, leadSeconds: v ?? 0 } })}
            error={errorAt(issues, "toast", "leadSeconds")}
          />
          <NumberField label="Compras das últimas (h)" min={1} max={168} value={toast.windowHours} onChange={(v) => set({ toast: { ...toast, windowHours: v ?? 48 } })} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">O toast usa só compras aprovadas registradas pelo webhook. Sem compras, não aparece.</p>
    </div>
  );
}
