import type { TrackingRepository } from "./repository";
import type { StoredEvent, StoredLead } from "./track-service";

type Timestamped<T> = T & { createdAt: string };

// Para dev sem banco e testes. Expõe as listas para inspeção.
export function createInMemoryTrackingRepository(
  now: () => Date = () => new Date(),
): TrackingRepository & { events: Timestamped<StoredEvent>[]; leads: Timestamped<StoredLead>[] } {
  const events: Timestamped<StoredEvent>[] = [];
  const leads: Timestamped<StoredLead>[] = [];
  return {
    events,
    leads,
    async insertEvent(event) {
      if (events.some((e) => e.eventId === event.eventId)) return false;
      events.push({ ...event, createdAt: now().toISOString() });
      return true;
    },
    async insertLead(lead) {
      leads.push({ ...lead, createdAt: now().toISOString() });
    },
  };
}
