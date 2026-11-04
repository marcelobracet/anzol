import type { TrackingRepository } from "./repository";
import type { StoredEvent, StoredLead } from "./track-service";

// Para dev sem banco e testes. Expõe as listas para inspeção.
export function createInMemoryTrackingRepository(): TrackingRepository & { events: StoredEvent[]; leads: StoredLead[] } {
  const events: StoredEvent[] = [];
  const leads: StoredLead[] = [];
  return {
    events,
    leads,
    async insertEvent(event) {
      if (events.some((e) => e.eventId === event.eventId)) return false;
      events.push(event);
      return true;
    },
    async insertLead(lead) {
      leads.push(lead);
    },
  };
}
