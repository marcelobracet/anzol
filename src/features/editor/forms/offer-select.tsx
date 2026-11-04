"use client";

import type { Offer } from "@/features/quiz/document/schema";
import { SelectField } from "../components/fields";

export function OfferSelect({ offers, value, onChange }: { offers: Offer[]; value: string; onChange: (id: string) => void }) {
  const options = offers.map((o, i) => ({ value: o.id, label: `Oferta ${i + 1} · ${o.provider}${o.productId ? ` · ${o.productId}` : ""}` }));
  return <SelectField label="Oferta" value={value} options={options} onChange={onChange} />;
}
