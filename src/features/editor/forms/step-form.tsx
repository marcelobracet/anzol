"use client";

import type { ComponentType } from "react";
import type { Step, StepType } from "@/features/steps/schema";
import { TextField } from "../components/fields";
import { errorAt, STEP_TYPE_LABELS } from "../document-ops";
import type { StepFormProps } from "./form-props";
import { InfoForm } from "./info-form";
import { LoadingForm } from "./loading-form";
import { QuestionForm } from "./question-form";
import { ResultForm } from "./result-form";

const FORMS: Partial<{ [T in StepType]: ComponentType<StepFormProps<Extract<Step, { type: T }>>> }> = {
  question: QuestionForm,
  info: InfoForm,
  loading: LoadingForm,
  result: ResultForm,
};

export function StepForm(props: StepFormProps) {
  const { step, onChange, issues } = props;
  const Form = FORMS[step.type] as ComponentType<StepFormProps> | undefined;
  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{STEP_TYPE_LABELS[step.type]}</p>
      <TextField
        label="Nome interno"
        hint="Aparece no Studio e no funil"
        maxLength={80}
        value={step.name}
        onChange={(name) => onChange({ ...step, name })}
        error={errorAt(issues, "name")}
      />
      {Form ? <Form {...props} /> : <p className="text-sm text-muted-foreground">Edição deste tipo chega nas próximas entregas.</p>}
    </div>
  );
}
