"use client";

import type { LeadFormStep } from "@/features/steps/lead-form/schema";
import { CheckboxField, TextField } from "../components/fields";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";

const FIELD_NAMES = { name: "Nome", email: "E-mail", phone: "Telefone / WhatsApp" } as const;
type FieldKey = keyof typeof FIELD_NAMES;

export function LeadFormForm({ step, onChange, issues }: StepFormProps<LeadFormStep>) {
  const set = (patch: Partial<LeadFormStep>) => onChange({ ...step, ...patch });
  const setField = <K extends FieldKey>(key: K, patch: Partial<LeadFormStep["fields"][K]>) =>
    set({ fields: { ...step.fields, [key]: { ...step.fields[key], ...patch } } });

  return (
    <div className="grid gap-4">
      <TextField label="Título" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <TextField label="Subtítulo" value={step.subtitle} onChange={(v) => set({ subtitle: v || undefined })} />
      <h3 className="text-sm font-semibold">Campos</h3>
      {errorAt(issues, "fields") && <p className="text-xs text-destructive">{errorAt(issues, "fields")}</p>}
      {(Object.keys(FIELD_NAMES) as FieldKey[]).map((key) => {
        const field = step.fields[key];
        return (
          <div key={key} className="grid gap-2 rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between">
              <CheckboxField label={FIELD_NAMES[key]} checked={field.enabled} onChange={(enabled) => setField(key, { enabled })} />
              {field.enabled && <CheckboxField label="Obrigatório" checked={field.required} onChange={(required) => setField(key, { required })} />}
            </div>
            {field.enabled && (
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Rótulo" value={field.label} onChange={(label) => setField(key, { label })} error={errorAt(issues, "fields", key, "label")} />
                <TextField label="Exemplo" value={field.placeholder} onChange={(v) => setField(key, { placeholder: v || undefined })} />
              </div>
            )}
            {key === "phone" && field.enabled && (
              <TextField
                label="País padrão (2 letras)"
                hint="Vazio: país do locale do quiz. Número salvo em E.164."
                maxLength={2}
                value={step.fields.phone.defaultCountry}
                onChange={(v) => setField("phone", { defaultCountry: v.trim().toUpperCase() || undefined })}
                error={errorAt(issues, "fields", "phone", "defaultCountry")}
              />
            )}
          </div>
        );
      })}
      <CheckboxField
        label="Pedir aceite (termo + política de privacidade)"
        checked={Boolean(step.consent)}
        onChange={(on) => set({ consent: on ? { text: "Aceito receber contato e concordo com a política de privacidade.", privacyPolicyUrl: "" } : undefined })}
      />
      {step.consent && (
        <>
          <TextField label="Texto do aceite" value={step.consent.text} onChange={(text) => set({ consent: { ...step.consent!, text } })} error={errorAt(issues, "consent", "text")} />
          <TextField
            label="Link da política de privacidade"
            value={step.consent.privacyPolicyUrl}
            onChange={(privacyPolicyUrl) => set({ consent: { ...step.consent!, privacyPolicyUrl: privacyPolicyUrl.trim() } })}
            error={errorAt(issues, "consent", "privacyPolicyUrl")}
          />
        </>
      )}
      <TextField label="Texto do botão" value={step.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} error={errorAt(issues, "ctaLabel")} />
    </div>
  );
}
