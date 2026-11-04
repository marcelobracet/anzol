"use client";

import { t } from "@/features/runtime/i18n";

// Aceitar e recusar com o mesmo peso visual (exigência do RGPD).
export function ConsentBanner({ locale, onChoose }: { locale: string; onChoose: (granted: boolean) => void }) {
  const button = "flex-1 rounded-[var(--q-radius)] border-2 border-[var(--q-primary)] px-4 py-2 text-sm font-semibold";
  return (
    <div role="dialog" aria-live="polite" aria-label={t(locale, "consentTitle")} className="fixed inset-x-0 bottom-0 z-50 p-3">
      <div className="mx-auto max-w-md rounded-[var(--q-radius)] bg-[var(--q-surface)] p-4 text-sm shadow-2xl">
        <p>{t(locale, "consentText")}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" className={button} onClick={() => onChoose(false)}>
            {t(locale, "reject")}
          </button>
          <button type="button" className={`${button} bg-[var(--q-primary)] text-[var(--q-on-primary)]`} onClick={() => onChoose(true)}>
            {t(locale, "accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
