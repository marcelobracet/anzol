"use client";

import { useEffect, useState } from "react";
import { t } from "@/features/runtime/i18n";
import { type LiveViewers, nextTickMs, nextViewers } from "./live-viewers";

type Props = { config: LiveViewers; locale: string };

// Pílula "● 88 assistindo agora". Começa na base (igual no servidor) e oscila aos poucos no cliente.
export function LiveViewersBadge({ config, locale }: Props) {
  const { base, spread } = config;
  const [count, setCount] = useState(base);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      timer = setTimeout(() => {
        setCount((current) => nextViewers(current, { enabled: true, base, spread }));
        tick();
      }, nextTickMs());
    };
    tick();
    return () => clearTimeout(timer);
  }, [base, spread]);

  const [before, after] = t(locale, "watchingNow").split("{count}");
  return (
    <div className="flex justify-center">
      <p className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-sm dark:bg-white/10" aria-live="off">
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
        <span>
          {before}
          <strong className="tabular-nums">{count.toLocaleString(locale)}</strong>
          {after}
        </span>
      </p>
    </div>
  );
}
