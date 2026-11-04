import type { ComponentType } from "react";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { InfoView } from "./info/info-view";
import { LoadingView } from "./loading/loading-view";
import { QuestionView } from "./question/question-view";
import { ResultView } from "./result/result-view";
import type { Step, StepType } from "./schema";
import type { StepViewProps } from "./step-view-props";

// Tipos ainda sem renderer (chegam nas próximas entregas) só deixam avançar.
function PendingView({ step, dispatch, isLast }: StepViewProps) {
  return (
    <>
      <p className="opacity-60">{step.name}</p>
      {!isLast && <StickyCta onClick={() => dispatch({ type: "next" })}>Continuar</StickyCta>}
    </>
  );
}

const VIEWS: { [T in StepType]: ComponentType<StepViewProps<Extract<Step, { type: T }>>> } = {
  question: QuestionView,
  info: InfoView,
  loading: LoadingView,
  result: ResultView,
  socialProof: PendingView,
  leadForm: PendingView,
  vsl: PendingView,
  offerTimer: PendingView,
};

export function StepView(props: StepViewProps) {
  const View = VIEWS[props.step.type] as ComponentType<StepViewProps>;
  return <View {...props} />;
}
