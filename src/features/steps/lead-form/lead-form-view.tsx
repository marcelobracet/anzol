"use client";

import { useState, type FormEvent } from "react";
import { StickyCta } from "@/features/runtime/components/quiz-button";
import { t } from "@/features/runtime/i18n";
import { interpolate } from "@/features/runtime/interpolate";
import { defaultPhoneCountry, normalizeLead, type LeadErrors, type LeadInput } from "@/features/tracking/lead";
import type { StepViewProps } from "../step-view-props";
import type { LeadFormStep } from "./schema";

const INPUT =
  "min-h-12 w-full rounded-[var(--q-radius)] border-2 border-transparent bg-[var(--q-surface)] px-4 text-base outline-none focus:border-[var(--q-primary)] aria-invalid:border-red-500";

const FIELD_ATTRS = {
  name: { type: "text", autoComplete: "name", inputMode: "text" },
  email: { type: "email", autoComplete: "email", inputMode: "email" },
  phone: { type: "tel", autoComplete: "tel", inputMode: "tel" },
} as const;

export default function LeadFormView({ step, ctx, dispatch, runtime, isLast }: StepViewProps<LeadFormStep>) {
  const [values, setValues] = useState<LeadInput>({});
  const [consented, setConsented] = useState(false);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const phoneCountry = step.fields.phone.defaultCountry ?? defaultPhoneCountry(runtime.locale);
  const keys = (["name", "email", "phone"] as const).filter((k) => step.fields[k].enabled);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const local = normalizeLead(values, step.fields, phoneCountry);
    if (!local.success) return setErrors(local.errors);
    if (step.consent && !consented) return;
    setErrors({});
    setStatus("sending");
    const outcome = await runtime.track("lead", step.id, { lead: { ...values, consented } });
    if (!outcome.ok) {
      setStatus("error");
      if (outcome.fieldErrors) setErrors(outcome.fieldErrors);
      return;
    }
    runtime.onLead(local.data.name?.split(" ")[0]);
    if (!isLast) dispatch({ type: "next" });
    else setStatus("idle");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <h1 className="text-2xl leading-tight font-bold text-balance">{interpolate(step.title, ctx)}</h1>
      {step.subtitle && <p className="mt-2 opacity-80">{interpolate(step.subtitle, ctx)}</p>}
      <div className="mt-6 grid gap-4">
        {keys.map((key) => {
          const field = step.fields[key];
          const error = errors[key];
          return (
            <label key={key} className="grid gap-1.5 text-sm font-medium">
              {field.label}
              {field.required && <span className="sr-only"> ({t(runtime.locale, "required")})</span>}
              <input
                {...FIELD_ATTRS[key]}
                name={key}
                className={INPUT}
                placeholder={field.placeholder}
                value={values[key] ?? ""}
                aria-invalid={Boolean(error)}
                required={field.required}
                maxLength={key === "email" ? 254 : 120}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
              {error && <span className="text-xs text-red-600">{t(runtime.locale, error)}</span>}
            </label>
          );
        })}
        {step.consent && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-5 shrink-0" checked={consented} onChange={(e) => setConsented(e.target.checked)} required />
            <span>
              {interpolate(step.consent.text, ctx)}{" "}
              <a href={step.consent.privacyPolicyUrl} target="_blank" rel="noreferrer" className="underline">
                ↗
              </a>
            </span>
          </label>
        )}
      </div>
      {status === "error" && Object.keys(errors).length === 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600">{t(runtime.locale, "sendError")}</p>
      )}
      <StickyCta type="submit" disabled={status === "sending" || Boolean(step.consent && !consented)}>
        {status === "sending" ? t(runtime.locale, "sending") : interpolate(step.ctaLabel, ctx)}
      </StickyCta>
    </form>
  );
}
