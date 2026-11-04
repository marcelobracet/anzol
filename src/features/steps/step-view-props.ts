import type { Dispatch } from "react";
import type { Offer } from "@/features/quiz/document/schema";
import type { QuizAction } from "@/features/runtime/engine";
import type { InterpolationContext } from "@/features/runtime/interpolate";
import type { Step } from "./schema";

// Dados do quiz e do ambiente que alguns steps precisam (checkout, vídeo, toast).
export type RuntimeContext = {
  locale: string;
  offers: Offer[];
  embedded: boolean; // preview do Studio
  bunnyHost?: string;
  purchasesEndpoint: string | null;
};

export type StepViewProps<S extends Step = Step> = {
  step: S;
  ctx: InterpolationContext;
  dispatch: Dispatch<QuizAction>;
  cloudName?: string;
  isFirst: boolean;
  isLast: boolean;
  runtime: RuntimeContext;
};
