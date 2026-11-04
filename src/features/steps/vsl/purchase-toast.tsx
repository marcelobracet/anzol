"use client";

import { useEffect, useState } from "react";
import type { ToastItem } from "@/features/purchases/recent";
import { relativeTime, t } from "@/features/runtime/i18n";

type Props = { endpoint: string; windowHours: number; locale: string };

const SHOW_MS = 5000;
const GAP_MS = 4000;

// Só renderiza com compras reais; sem compras ou com erro, nada aparece.
export function PurchaseToast({ endpoint, windowHours, locale }: Props) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("hours", String(windowHours));
    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { success: boolean; data?: ToastItem[] } | null) => {
        if (body?.success && body.data) setItems(body.data);
      })
      .catch(() => {}); // toast é acessório: falha de rede não afeta o quiz
    return () => controller.abort();
  }, [endpoint, windowHours]);

  useEffect(() => {
    if (items.length === 0) return;
    let current = 0;
    let visible = false;
    const tick = () => {
      visible = !visible;
      if (visible) setIndex(current);
      else {
        setIndex(null);
        current = (current + 1) % items.length;
      }
      timer = setTimeout(tick, visible ? SHOW_MS : GAP_MS);
    };
    let timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  }, [items]);

  const item = index === null ? null : items[index];
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-24 left-4 z-30 max-w-[calc(100%-2rem)]">
      {item && (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[var(--q-radius)] bg-[var(--q-surface)] px-4 py-3 text-sm shadow-lg">
          <p className="font-semibold">
            🛒 {item.city ? t(locale, "justBought", { name: item.firstName, city: item.city }) : t(locale, "justBoughtNoCity", { name: item.firstName })}
          </p>
          <p className="text-xs opacity-70">{relativeTime(item.minutesAgo, locale)}</p>
        </div>
      )}
    </div>
  );
}
