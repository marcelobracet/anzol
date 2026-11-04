import { z } from "zod";
import { HttpsUrl, StepBase, Text } from "../shared/primitives";

const Field = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
  label: Text.min(1),
  placeholder: Text.optional(),
});

export const LeadFormStep = StepBase.extend({
  type: z.literal("leadForm"),
  title: Text.min(1),
  subtitle: Text.optional(),
  fields: z
    .object({
      name: Field,
      email: Field,
      // Normalizado para E.164 com libphonenumber-js; país padrão derivado do locale se ausente.
      phone: Field.extend({ defaultCountry: z.string().length(2).optional() }),
    })
    .refine((f) => f.name.enabled || f.email.enabled || f.phone.enabled, "Habilite ao menos um campo"),
  consent: z.object({ text: Text.min(1), privacyPolicyUrl: HttpsUrl }).optional(),
  ctaLabel: Text.min(1),
});
export type LeadFormStep = z.infer<typeof LeadFormStep>;
