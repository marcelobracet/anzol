import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { z } from "zod";

type FieldRule = { enabled: boolean; required: boolean };
export type LeadFieldRules = { name: FieldRule; email: FieldRule; phone: FieldRule };
export type LeadInput = { name?: string; email?: string; phone?: string };
export type NormalizedLead = { name?: string; email?: string; phone?: string };
export type LeadErrors = Partial<Record<keyof LeadInput, "required" | "invalid">>;

const Email = z.email();

export function defaultPhoneCountry(locale: string): string {
  return (locale.split("-")[1] ?? "BR").toUpperCase();
}

function toE164(raw: string, country: string): string | null {
  const phone = parsePhoneNumberFromString(raw, country as CountryCode);
  return phone?.isValid() ? phone.number : null;
}

// Mesma regra no navegador (feedback) e no servidor (fonte da verdade).
export function normalizeLead(
  input: LeadInput,
  rules: LeadFieldRules,
  phoneCountry: string,
): { success: true; data: NormalizedLead } | { success: false; errors: LeadErrors } {
  const errors: LeadErrors = {};
  const data: NormalizedLead = {};

  const name = input.name?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.trim() ?? "";

  if (rules.name.enabled) {
    if (name) data.name = name;
    else if (rules.name.required) errors.name = "required";
  }
  if (rules.email.enabled) {
    if (!email) {
      if (rules.email.required) errors.email = "required";
    } else if (Email.safeParse(email).success) data.email = email;
    else errors.email = "invalid";
  }
  if (rules.phone.enabled) {
    if (!phone) {
      if (rules.phone.required) errors.phone = "required";
    } else {
      const e164 = toE164(phone, phoneCountry);
      if (e164) data.phone = e164;
      else errors.phone = "invalid";
    }
  }
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data };
}
