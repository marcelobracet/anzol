import { MediaView } from "@/features/media/components/media-view";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { interpolate } from "@/features/runtime/interpolate";
import type { StepViewProps } from "../step-view-props";
import type { SocialProofStep } from "./schema";

export function SocialProofView({ step, ctx, dispatch, cloudName, isLast }: StepViewProps<SocialProofStep>) {
  const carousel = step.layout === "carousel";
  return (
    <>
      {step.title && <h1 className="mb-5 text-2xl leading-tight font-bold text-balance">{interpolate(step.title, ctx)}</h1>}
      <ul
        className={
          carousel
            ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"
            : "grid gap-4"
        }
      >
        {step.items.map((item) => (
          <li key={item.id} className={carousel ? "w-[80%] shrink-0 snap-center" : ""}>
            <MediaView media={item.image} cloudName={cloudName} sizes={carousel ? "80vw" : "100vw"} />
            {item.caption && <p className="mt-2 text-sm opacity-80">{interpolate(item.caption, ctx)}</p>}
          </li>
        ))}
      </ul>
      {!isLast && <StickyCta onClick={() => dispatch({ type: "next" })}>{interpolate(step.ctaLabel, ctx)}</StickyCta>}
    </>
  );
}
