import type { ComponentType } from "react";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { t } from "@/features/runtime/i18n";
import { InfoView } from "./info/info-view";
import { LoadingView } from "./loading/loading-view";
import { OfferTimerView } from "./offer-timer/offer-timer-view";
import { QuestionView } from "./question/question-view";
import { ResultView } from "./result/result-view";
import type { Step, StepType } from "./schema";
import type { StepViewProps } from "./step-view-props";
import { VslView } from "./vsl/vsl-view";

// Tipos ainda sem renderer (chegam nas próximas entregas) só deixam avançar.
function PendingView({ step, dispatch, isLast, runtime }: StepViewProps) {
  return (
    <>
      <p className="opacity-60">{step.name}</p>
      {!isLast && <StickyCta onClick={() => dispatch({ type: "next" })}>{t(runtime.locale, "continue")}</StickyCta>}
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
  vsl: VslView,
  offerTimer: OfferTimerView,
};

export function StepView(props: StepViewProps) {
  const View = VIEWS[props.step.type] as ComponentType<StepViewProps>;
  return <View {...props} />;
}
