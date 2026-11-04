import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackingRepository } from "./repository";

const UNIQUE_VIOLATION = "23505";

export function createSupabaseTrackingRepository(db: SupabaseClient): TrackingRepository {
  return {
    async insertEvent(event) {
      const { error } = await db.from("events").insert({
        event_id: event.eventId,
        quiz_id: event.quizId,
        version_id: event.versionId,
        session_id: event.sessionId,
        step_id: event.stepId,
        type: event.type,
        utm: event.utm,
      });
      if (error?.code === UNIQUE_VIOLATION) return false; // retry do mesmo event_id
      if (error) throw new Error(`Supabase events: ${error.message}`);
      return true;
    },
    async insertLead(lead) {
      const { error } = await db.from("leads").insert({
        quiz_id: lead.quizId,
        session_id: lead.sessionId,
        name: lead.name,
        email: lead.email,
        phone_e164: lead.phoneE164,
        utm: lead.utm,
        consent_at: lead.consentAt,
      });
      if (error) throw new Error(`Supabase leads: ${error.message}`);
    },
  };
}
