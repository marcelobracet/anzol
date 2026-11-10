import { Bell, Clock, Compass, Flame, Gift, Heart, Play, Star, TriangleAlert, type LucideIcon } from "lucide-react";
import { MediaView } from "@/features/media/components/media-view";
import type { BannerStyle } from "@/features/steps/vsl/schema";
import { bannerStyle } from "../page-style";

const ICONS: Record<Exclude<BannerStyle["icon"], "none">, LucideIcon> = {
  compass: Compass,
  clock: Clock,
  alert: TriangleAlert,
  flame: Flame,
  play: Play,
  gift: Gift,
  star: Star,
  heart: Heart,
  bell: Bell,
};

type Props = { text: string; style: BannerStyle; cloudName?: string };

// Faixa do topo: texto com ícone (ou imagem própria) num círculo animado.
export function PageBanner({ text, style, cloudName }: Props) {
  const Icon = style.icon === "none" ? null : ICONS[style.icon];
  const image = style.iconImage && cloudName ? style.iconImage : null;
  const animation = style.animation === "none" ? "" : `q-anim-${style.animation}`;
  return (
    <div style={bannerStyle(style)} className="flex items-center justify-center gap-3 px-4 py-2.5 text-center text-sm font-bold text-balance sm:text-base">
      {(image || Icon) && (
        <span aria-hidden className={`grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 ${animation}`}>
          {image ? <MediaView media={image} cloudName={cloudName} priority sizes="32px" /> : Icon && <Icon className="size-4" strokeWidth={2.5} />}
        </span>
      )}
      <span>{text}</span>
    </div>
  );
}
