"use client";

import type { Offer } from "@/features/quiz/document/schema";
import { CheckboxField, Field, SelectField, TextField } from "../components/fields";
import { errorAt, type EditorIssue } from "../document-ops";

const PROVIDERS = [
  { value: "hotmart", label: "Hotmart" },
  { value: "kiwify", label: "Kiwify" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

// datetime-local trabalha no fuso do navegador; o documento guarda ISO em UTC.
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

type Props = {
  offers: Offer[];
  issues?: EditorIssue[];
  inUse: (id: string) => boolean;
  onAdd: () => void;
  onChange: (offer: Offer) => void;
  onRemove: (id: string) => void;
};

export function OffersForm({ offers, issues, inUse, onAdd, onChange, onRemove }: Props) {
  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ofertas (checkout)</p>
      <p className="text-xs text-muted-foreground">
        As UTMs (e src/sck) da URL do quiz são repassadas ao checkout e substituem as que estiverem no link.
      </p>
      {offers.map((offer, i) => {
        const path = ["offers", i];
        return (
          <div key={offer.id} className="grid gap-3 rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Oferta {i + 1}</span>
              <button
                type="button"
                className="text-destructive disabled:opacity-40"
                disabled={inUse(offer.id)}
                title={inUse(offer.id) ? "Usada por um step" : undefined}
                onClick={() => onRemove(offer.id)}
              >
                Remover
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectField label="Plataforma" value={offer.provider} options={PROVIDERS} onChange={(provider) => onChange({ ...offer, provider })} />
              <TextField
                label="ID do produto"
                hint="Liga a compra (webhook) ao quiz"
                maxLength={64}
                value={offer.productId}
                onChange={(v) => onChange({ ...offer, productId: v.trim() || undefined })}
              />
            </div>
            <TextField
              label="Link do checkout (preço cheio)"
              placeholder="https://pay.hotmart.com/..."
              value={offer.fullPriceUrl}
              onChange={(fullPriceUrl) => onChange({ ...offer, fullPriceUrl: fullPriceUrl.trim() })}
              error={errorAt(issues, ...path, "fullPriceUrl")}
            />
            <CheckboxField
              label="Tem preço promocional com prazo"
              checked={Boolean(offer.promo)}
              onChange={(on) =>
                onChange({ ...offer, promo: on ? { url: "", expiresAt: new Date(Date.now() + 86_400_000).toISOString() } : undefined })
              }
            />
            {offer.promo && (
              <>
                <TextField
                  label="Link do checkout promocional"
                  value={offer.promo.url}
                  onChange={(url) => onChange({ ...offer, promo: { ...offer.promo!, url: url.trim() } })}
                  error={errorAt(issues, ...path, "promo", "url")}
                />
                <Field label="Promoção termina em" hint="Horário deste computador. Depois disso o checkout volta ao preço cheio." error={errorAt(issues, ...path, "promo", "expiresAt")}>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
                    value={toLocalInput(offer.promo.expiresAt)}
                    onChange={(e) => onChange({ ...offer, promo: { ...offer.promo!, expiresAt: fromLocalInput(e.target.value) } })}
                  />
                </Field>
              </>
            )}
          </div>
        );
      })}
      <button type="button" className="rounded-lg border border-dashed py-2 text-sm hover:bg-muted" onClick={onAdd}>
        + Oferta
      </button>
    </div>
  );
}
