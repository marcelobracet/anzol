"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MetaEventName } from "../capi";
import { isEuLocale } from "../consent";
import { META_EVENT, type TrackType } from "../event-types";
import type { LeadErrors } from "../lead";
import { loadPixel, pixelTrack } from "./pixel";
import { fbcFromClick, initialConsent, pixelAllowed, readCookie, readUtm, type ConsentState } from "./utils";

export type TrackExtra = {
  lead?: { name?: string; email?: string; phone?: string; consented: boolean };
  answer?: { optionIds: string[] };
};
export type TrackOutcome = { ok: true } | { ok: false; fieldErrors?: LeadErrors };
export type TrackFn = (type: TrackType, stepId?: string, extra?: TrackExtra) => Promise<TrackOutcome>;

type Options = { enabled: boolean; locale: string; slug: string | null; pixelId?: string };

const CONSENT_KEY = "anzol:consent";
// Espera a checagem de geo antes do primeiro evento (fbc/fbp e Pixel dependem dela), sem travar o quiz.
const READY_TIMEOUT_MS = 2000;
const SESSION_KEY = "anzol:sid";
const UTM_KEY = "anzol:utm";

function storage(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function sessionId(): string {
  const store = storage("session");
  const existing = store?.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID().replace(/-/g, "");
  store?.setItem(SESSION_KEY, id);
  return id;
}

// UTMs do primeiro acesso da sessão (a URL pode perder os parâmetros depois).
function firstTouchUtm() {
  const store = storage("session");
  const saved = store?.getItem(UTM_KEY);
  if (saved) return JSON.parse(saved) as ReturnType<typeof readUtm>;
  const utm = readUtm(window.location.search);
  store?.setItem(UTM_KEY, JSON.stringify(utm));
  return utm;
}

export function useTracker({ enabled, locale, slug, pixelId }: Options) {
  const [consent, setConsent] = useState<ConsentState>("pending");
  const consentRef = useRef<ConsentState>("pending");
  const queued = useRef<{ name: MetaEventName; eventId: string }[]>([]);
  const [readiness] = useState(() => {
    let resolve = () => {};
    const promise = new Promise<void>((r) => (resolve = r));
    return { promise, resolve };
  });
  useEffect(() => {
    consentRef.current = consent;
    if (consent !== "pending") readiness.resolve();
  }, [consent, readiness]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/t/geo", { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { data?: { euVisitor?: boolean } }) => body.data?.euVisitor ?? true)
      .catch(() => true) // sem geo, na dúvida pede consentimento
      .then((euVisitor) => {
        if (controller.signal.aborted) return;
        setConsent(initialConsent({ euLocale: isEuLocale(locale), euVisitor, saved: storage("local")?.getItem(CONSENT_KEY) ?? null }));
      });
    return () => controller.abort();
  }, [enabled, locale]);

  useEffect(() => {
    if (!pixelId || !pixelAllowed(consent)) {
      if (consent === "denied") queued.current = [];
      return;
    }
    loadPixel(pixelId);
    for (const event of queued.current) pixelTrack(event.name, event.eventId);
    queued.current = [];
  }, [consent, pixelId]);

  const track = useCallback<TrackFn>(
    async (type, stepId, extra) => {
      if (!enabled) return { ok: true };
      await Promise.race([readiness.promise, new Promise((r) => setTimeout(r, READY_TIMEOUT_MS))]);
      const eventId = crypto.randomUUID();
      const metaName = META_EVENT[type];
      const state = consentRef.current;
      if (metaName && pixelId) {
        if (pixelAllowed(state)) pixelTrack(metaName, eventId);
        else if (state === "pending" || state === "ask") queued.current.push({ name: metaName, eventId });
      }
      const allowed = pixelAllowed(state);
      const body = {
        eventId,
        type,
        sessionId: sessionId(),
        slug,
        stepId,
        pageUrl: window.location.href.slice(0, 2000),
        utm: firstTouchUtm(),
        consent: state === "granted" ? "granted" : state === "denied" ? "denied" : "unset",
        fbp: allowed ? readCookie(document.cookie, "_fbp") : undefined,
        fbc: allowed ? (readCookie(document.cookie, "_fbc") ?? fbcFromClick(window.location.search, Date.now())) : undefined,
        lead: extra?.lead,
        answer: extra?.answer,
      };
      try {
        const response = await fetch("/api/t", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true, // sobrevive à navegação para o checkout
        });
        if (response.ok) return { ok: true };
        const json = (await response.json().catch(() => null)) as { fieldErrors?: LeadErrors } | null;
        return { ok: false, fieldErrors: json?.fieldErrors };
      } catch {
        // Rastreio não pode travar o quiz; só o lead precisa de confirmação.
        return type === "lead" ? { ok: false } : { ok: true };
      }
    },
    [enabled, slug, pixelId, readiness],
  );

  const choose = useCallback((granted: boolean) => {
    storage("local")?.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    setConsent(granted ? "granted" : "denied");
  }, []);

  return { track, consent, choose };
}
