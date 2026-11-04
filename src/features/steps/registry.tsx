import { lazy, Suspense, type ComponentType } from "react";
import { InfoView } from "./info/info-view";
import { LoadingView } from "./loading/loading-view";
import { OfferTimerView } from "./offer-timer/offer-timer-view";
import { QuestionView } from "./question/question-view";
import { SocialProofView } from "./social-proof/social-proof-view";
import { ResultView } from "./result/result-view";
import type { Step, StepType } from "./schema";
import type { StepViewProps } from "./step-view-props";
import { VslView } from "./vsl/vsl-view";

// Formulário de lead em chunk separado: a validação de telefone pesa e só ele usa.
const LeadFormView = lazy(() => import("./lead-form/lead-form-view"));

function LazyLeadForm(props: StepViewProps<Extract<Step, { type: "leadForm" }>>) {
  return (
    <Suspense fallback={<div className="min-h-64" aria-busy />}>
      <LeadFormView {...props} />
    </Suspense>
  );
}

const VIEWS: { [T in StepType]: ComponentType<StepViewProps<Extract<Step, { type: T }>>> } = {
  question: QuestionView,
  info: InfoView,
  loading: LoadingView,
  result: ResultView,
  socialProof: SocialProofView,
  leadForm: LazyLeadForm,
  vsl: VslView,
  offerTimer: OfferTimerView,
};

export function StepView(props: StepViewProps) {
  const View = VIEWS[props.step.type] as ComponentType<StepViewProps>;
  return <View {...props} />;
}
