import type { Dispatch } from "react";
import type { QuizAction } from "@/features/runtime/engine";
import type { InterpolationContext } from "@/features/runtime/interpolate";
import type { Step } from "./schema";

export type StepViewProps<S extends Step = Step> = {
  step: S;
  ctx: InterpolationContext;
  dispatch: Dispatch<QuizAction>;
  cloudName?: string;
  isFirst: boolean;
  isLast: boolean;
};
