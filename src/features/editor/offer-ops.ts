import type { Offer, QuizDocument } from "@/features/quiz/document/schema";
import { newId } from "@/features/steps/shared/primitives";

// Nasce com URL vazia: o editor marca o campo até ser preenchido.
export function addOffer(doc: QuizDocument): { doc: QuizDocument; id: string } {
  const offer: Offer = { id: newId(), provider: "hotmart", fullPriceUrl: "" };
  return { doc: { ...doc, offers: [...doc.offers, offer] }, id: offer.id };
}

export function updateOffer(doc: QuizDocument, offer: Offer): QuizDocument {
  return { ...doc, offers: doc.offers.map((o) => (o.id === offer.id ? offer : o)) };
}

export function offerInUse(doc: QuizDocument, offerId: string): boolean {
  return doc.steps.some(
    (s) => (s.type === "vsl" && s.cta.offerId === offerId) || (s.type === "offerTimer" && s.offerId === offerId),
  );
}

export function removeOffer(doc: QuizDocument, offerId: string): QuizDocument {
  if (offerInUse(doc, offerId)) return doc;
  return { ...doc, offers: doc.offers.filter((o) => o.id !== offerId) };
}
