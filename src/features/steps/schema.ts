import { z } from "zod";
import { InfoStep } from "./info/schema";
import { LeadFormStep } from "./lead-form/schema";
import { LoadingStep } from "./loading/schema";
import { OfferTimerStep } from "./offer-timer/schema";
import { QuestionStep } from "./question/schema";
import { ResultStep } from "./result/schema";
import { SocialProofStep } from "./social-proof/schema";
import { VslStep } from "./vsl/schema";

// Novo tipo de step: criar /features/steps/<tipo>/schema.ts e registrar aqui.
export const Step = z.discriminatedUnion("type", [
  QuestionStep,
  InfoStep,
  SocialProofStep,
  LoadingStep,
  LeadFormStep,
  ResultStep,
  VslStep,
  OfferTimerStep,
]);
export type Step = z.infer<typeof Step>;
export type StepType = Step["type"];
