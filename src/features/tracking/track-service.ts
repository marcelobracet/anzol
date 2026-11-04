import type { PublishedQuiz } from "@/features/runtime/published-source";
import type { LeadFormStep } from "@/features/steps/lead-form/schema";
import { buildCapiEvent, type CapiEvent } from "./capi";
import { consentRequired } from "./consent";
import { META_EVENT, TrackRequest } from "./event-types";
import { defaultPhoneCountry, normalizeLead, type LeadErrors, type NormalizedLead } from "./lead";

export type StoredEvent = {
  eventId: string;
  quizId: string;
  versionId: string;
  sessionId: string;
  stepId: string | null;
  type: TrackRequest["type"];
  utm: TrackRequest["utm"];
};
export type StoredLead = {
  quizId: string;
  sessionId: string;
  name: string | null;
  email: string | null;
  phoneE164: string | null;
  utm: TrackRequest["utm"];
  consentAt: string | null;
};

export type TrackDeps = {
  loadQuiz: (host: string, slug: string | null) => Promise<PublishedQuiz | null>;
  repo: {
    /** false quando o event_id já existe (retry): nada mais é feito. */
    insertEvent: (event: StoredEvent) => Promise<boolean>;
    insertLead: (lead: StoredLead) => Promise<void>;
  };
  sendCapi: (pixelId: string, event: CapiEvent) => Promise<void>;
  capiToken?: string;
  now: () => Date;
};

export type TrackInput = { body: unknown; host: string; ip?: string; userAgent?: string; country: string | null };
type CapiOutcome = "sent" | "skipped" | "failed";
export type TrackResult =
  | { success: true; data: { stored: boolean; capi: CapiOutcome } }
  | { success: false; status: 400 | 404 | 422; error: string; fieldErrors?: LeadErrors };

const invalid = (error: string): TrackResult => ({ success: false, status: 400, error });

function validateLead(request: TrackRequest, step: LeadFormStep, locale: string): TrackResult | NormalizedLead {
  if (!request.lead) return { success: false, status: 422, error: "Dados do lead ausentes" };
  if (step.consent && !request.lead.consented) return { success: false, status: 422, error: "Aceite obrigatório" };
  const country = step.fields.phone.defaultCountry ?? defaultPhoneCountry(locale);
  const lead = normalizeLead(request.lead, step.fields, country);
  return lead.success ? lead.data : { success: false, status: 422, error: "Dados inválidos", fieldErrors: lead.errors };
}

export function createTrackService(deps: TrackDeps) {
  async function forwardToMeta(request: TrackRequest, quiz: PublishedQuiz, input: TrackInput, lead?: NormalizedLead): Promise<CapiOutcome> {
    const eventName = META_EVENT[request.type];
    const pixelId = quiz.document.tracking.metaPixelId;
    const needsConsent = consentRequired({ locale: quiz.locale, country: input.country });
    if (!eventName || !pixelId || !deps.capiToken || (needsConsent && request.consent !== "granted")) return "skipped";
    const event = buildCapiEvent({
      eventName,
      eventId: request.eventId,
      eventTime: Math.floor(deps.now().getTime() / 1000),
      sourceUrl: request.pageUrl,
      ip: input.ip,
      userAgent: input.userAgent,
      fbp: request.fbp,
      fbc: request.fbc,
      country: input.country ?? undefined,
      lead,
    });
    try {
      await deps.sendCapi(pixelId, event);
      return "sent";
    } catch (error) {
      console.error("[capi] falha ao enviar evento", { eventId: request.eventId, type: request.type, error: String(error) });
      return "failed";
    }
  }

  return {
    async track(input: TrackInput): Promise<TrackResult> {
      const parsed = TrackRequest.safeParse(input.body);
      if (!parsed.success) return invalid("Evento inválido");
      const request = parsed.data;

      const quiz = await deps.loadQuiz(input.host, request.slug);
      if (!quiz) return { success: false, status: 404, error: "Quiz não encontrado" };
      const step = request.stepId ? quiz.document.steps.find((s) => s.id === request.stepId) : undefined;
      if (request.stepId && !step) return invalid("Step inexistente");

      let lead: NormalizedLead | undefined;
      if (request.type === "lead") {
        if (step?.type !== "leadForm") return invalid("Lead fora de um formulário");
        const result = validateLead(request, step, quiz.locale);
        if ("success" in result) return result;
        lead = result;
      }

      const stored = await deps.repo.insertEvent({
        eventId: request.eventId,
        quizId: quiz.quizId,
        versionId: quiz.versionId,
        sessionId: request.sessionId,
        stepId: request.stepId ?? null,
        type: request.type,
        utm: request.utm,
      });
      if (!stored) return { success: true, data: { stored: false, capi: "skipped" } };

      if (lead) {
        await deps.repo.insertLead({
          quizId: quiz.quizId,
          sessionId: request.sessionId,
          name: lead.name ?? null,
          email: lead.email ?? null,
          phoneE164: lead.phone ?? null,
          utm: request.utm,
          consentAt: request.lead?.consented ? deps.now().toISOString() : null,
        });
      }
      return { success: true, data: { stored: true, capi: await forwardToMeta(request, quiz, input, lead) } };
    },
  };
}
