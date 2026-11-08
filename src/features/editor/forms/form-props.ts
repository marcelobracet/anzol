import type { Offer } from "@/features/quiz/document/schema";
import type { Step } from "@/features/steps/schema";
import type { EditorIssue } from "../document-ops";

export type StepFormProps<S extends Step = Step> = {
  step: S;
  onChange: (step: S) => void;
  issues?: EditorIssue[];
  cloudName?: string;
  offers: Offer[];
  quizId?: string; // pasta do upload de vídeo
};
