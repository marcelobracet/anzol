import { z } from "zod";
import { TRACKING_PARAMS } from "@/features/checkout/checkout-url";
import { Id } from "@/features/steps/shared/primitives";
import type { MetaEventName } from "./capi";

export const TRACK_TYPES = ["quiz_start", "step_view", "answer", "vsl_view", "lead", "checkout_click"] as const;
export type TrackType = (typeof TRACK_TYPES)[number];

// Só estes vão para a Meta; step_view e answer ficam no funil interno.
export const META_EVENT: Partial<Record<TrackType, MetaEventName>> = {
  quiz_start: "PageView",
  vsl_view: "ViewContent",
  lead: "Lead",
  checkout_click: "InitiateCheckout",
};

export const TrackRequest = z.object({
  eventId: z.uuid(),
  type: z.enum(TRACK_TYPES),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60).nullable(),
  stepId: Id.optional(),
  pageUrl: z.url({ protocol: /^https?$/ }).max(2000),
  utm: z.partialRecord(z.enum(TRACKING_PARAMS), z.string().max(200)).default({}),
  consent: z.enum(["granted", "denied", "unset"]),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(500).optional(),
  answer: z.object({ optionIds: z.array(Id).min(1).max(12) }).optional(),
  lead: z
    .object({
      name: z.string().max(200).optional(),
      email: z.string().max(254).optional(),
      phone: z.string().max(40).optional(),
      consented: z.boolean(),
    })
    .optional(),
});
export type TrackRequest = z.infer<typeof TrackRequest>;
export type ConsentState = TrackRequest["consent"];
