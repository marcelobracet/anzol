import { beforeEach, describe, expect, it, vi } from "vitest";
import { fullDocumentInput } from "@/features/quiz/document/fixtures";
import { QuizDocument } from "@/features/quiz/document/schema";
import type { PublishedQuiz } from "@/features/runtime/published-source";
import { createTrackService, type TrackDeps } from "./track-service";

const QUIZ_ID = "6f1c2a3e-1111-4222-8333-944455556666";
const doc = QuizDocument.parse({
  schemaVersion: 1,
  theme: { colors: { primary: "#000000", background: "#FFFFFF", surface: "#EEEEEE", text: "#111111", accent: "#FF9900" }, font: "inter", radius: 8 },
  tracking: { metaPixelId: "1234567890" },
  steps: [
    { id: "intro", type: "info", name: "Intro", title: "Oi", ctaLabel: "Ir" },
    {
      id: "lead_1",
      type: "leadForm",
      name: "Lead",
      title: "Seus dados",
      fields: {
        name: { enabled: true, required: true, label: "Nome" },
        email: { enabled: true, required: true, label: "E-mail" },
        phone: { enabled: true, required: false, label: "WhatsApp" },
      },
      consent: { text: "Aceito", privacyPolicyUrl: "https://oferta.com/privacidade" },
      ctaLabel: "Enviar",
    },
  ],
});
const quiz = (locale = "es-MX"): PublishedQuiz => ({
  quizId: QUIZ_ID, slug: "q", locale, currency: "MXN", versionId: "7a1c2a3e-1111-4222-8333-944455556666", versionNumber: 1, document: doc,
});

let deps: TrackDeps & { events: unknown[]; leads: unknown[]; capi: ReturnType<typeof vi.fn> };
const body = (over: Record<string, unknown> = {}) => ({
  eventId: crypto.randomUUID(),
  type: "quiz_start",
  sessionId: "sess_12345678",
  slug: null,
  stepId: "intro",
  pageUrl: "https://oferta.com/?utm_source=fb",
  utm: { utm_source: "fb" },
  consent: "unset",
  ...over,
});
const request = (b: unknown, country: string | null = "MX") => ({ body: b, host: "oferta.com", ip: "200.1.2.3", userAgent: "UA", country });

beforeEach(() => {
  const events: { eventId: string }[] = [];
  const leads: unknown[] = [];
  const capi = vi.fn().mockResolvedValue(undefined);
  deps = {
    events,
    leads,
    capi,
    loadQuiz: vi.fn().mockResolvedValue(quiz()),
    repo: {
      insertEvent: async (e) => (events.some((x) => x.eventId === e.eventId) ? false : (events.push(e), true)),
      insertLead: async (l) => void leads.push(l),
    },
    sendCapi: capi,
    capiToken: "TOKEN",
    now: () => new Date("2026-11-04T12:00:00Z"),
  };
});

describe("track", () => {
  it("grava o evento com quiz e versão do servidor e manda PageView à CAPI com o mesmo event_id", async () => {
    const b = body();
    const result = await createTrackService(deps).track(request(b));
    expect(result).toEqual({ success: true, data: { stored: true, capi: "sent" } });
    expect(deps.events[0]).toMatchObject({ eventId: b.eventId, quizId: QUIZ_ID, versionId: quiz().versionId, type: "quiz_start", utm: { utm_source: "fb" } });
    expect(deps.capi.mock.calls[0][0]).toBe("1234567890");
    expect(deps.capi.mock.calls[0][1]).toMatchObject({ event_name: "PageView", event_id: b.eventId, user_data: { client_ip_address: "200.1.2.3" } });
  });

  it("event_id repetido não grava nem envia de novo", async () => {
    const service = createTrackService(deps);
    const b = body();
    await service.track(request(b));
    expect(await service.track(request(b))).toEqual({ success: true, data: { stored: false, capi: "skipped" } });
    expect(deps.capi).toHaveBeenCalledTimes(1);
  });

  it("step_view não vai para a Meta", async () => {
    const result = await createTrackService(deps).track(request(body({ type: "step_view" })));
    expect(result.success && result.data.capi).toBe("skipped");
  });

  it("sem consentimento: IP europeu não envia CAPI, mas registra o funil", async () => {
    const result = await createTrackService(deps).track(request(body(), "ES"));
    expect(result).toEqual({ success: true, data: { stored: true, capi: "skipped" } });
    expect(deps.capi).not.toHaveBeenCalled();
  });

  it("locale europeu com consentimento envia", async () => {
    deps.loadQuiz = vi.fn().mockResolvedValue(quiz("es-ES"));
    expect(await createTrackService(deps).track(request(body({ consent: "granted" }), "MX"))).toMatchObject({ data: { capi: "sent" } });
  });

  it("lead: normaliza, grava e manda Lead com dados com hash", async () => {
    const lead = { name: "Ana Maria", email: "Ana@Mail.com", phone: "55 1234 5678", consented: true };
    const result = await createTrackService(deps).track(request(body({ type: "lead", stepId: "lead_1", lead })));
    expect(result.success).toBe(true);
    expect(deps.leads[0]).toMatchObject({ quizId: QUIZ_ID, name: "Ana Maria", email: "ana@mail.com", phoneE164: "+525512345678", consentAt: "2026-11-04T12:00:00.000Z" });
    expect(deps.capi.mock.calls[0][1].user_data.em).toHaveLength(1);
  });

  it("lead sem aceite do termo ou com campo inválido é recusado", async () => {
    const service = createTrackService(deps);
    const noConsent = await service.track(request(body({ type: "lead", stepId: "lead_1", lead: { name: "Ana", email: "a@b.co", consented: false } })));
    expect(noConsent).toMatchObject({ success: false, status: 422 });
    const bad = await service.track(request(body({ type: "lead", stepId: "lead_1", lead: { name: "", email: "x", consented: true } })));
    expect(bad).toMatchObject({ success: false, status: 422, fieldErrors: { name: "required", email: "invalid" } });
    expect(deps.events).toHaveLength(0);
  });

  it("recusa corpo inválido, step inexistente e quiz não publicado", async () => {
    const service = createTrackService(deps);
    expect(await service.track(request({ type: "x" }))).toMatchObject({ success: false, status: 400 });
    expect(await service.track(request(body({ stepId: "nope" })))).toMatchObject({ success: false, status: 400 });
    deps.loadQuiz = vi.fn().mockResolvedValue(null);
    expect(await createTrackService(deps).track(request(body()))).toMatchObject({ success: false, status: 404 });
  });

  it("falha da CAPI não derruba o evento", async () => {
    deps.capi.mockRejectedValue(new Error("Invalid token"));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createTrackService(deps).track(request(body()))).toEqual({ success: true, data: { stored: true, capi: "failed" } });
    errors.mockRestore();
  });

  it("sem token ou sem Pixel ID não envia", async () => {
    expect(await createTrackService({ ...deps, capiToken: undefined }).track(request(body()))).toMatchObject({ data: { capi: "skipped" } });
  });
});

describe("vsl_progress (retenção do vídeo)", () => {
  const vslQuiz = (): PublishedQuiz => ({ ...quiz(), document: QuizDocument.parse(fullDocumentInput()) });
  const progress = (over: Record<string, unknown> = {}) => body({ type: "vsl_progress", stepId: "vsl_1", videoSecond: 30, ...over });

  beforeEach(() => {
    deps.loadQuiz = vi.fn().mockResolvedValue(vslQuiz());
  });

  it("grava o segundo assistido e não vai para a Meta", async () => {
    const result = await createTrackService(deps).track(request(progress()));
    expect(result).toEqual({ success: true, data: { stored: true, capi: "skipped" } });
    expect(deps.events[0]).toMatchObject({ type: "vsl_progress", stepId: "vsl_1", videoSecond: 30 });
    expect(deps.capi).not.toHaveBeenCalled();
  });

  it("recusa sem segundo, fora da grade de marcos ou fora de um step VSL", async () => {
    const service = createTrackService(deps);
    expect(await service.track(request(progress({ videoSecond: undefined })))).toMatchObject({ success: false, status: 400 });
    expect(await service.track(request(progress({ videoSecond: 31 })))).toMatchObject({ success: false, status: 400 });
    expect(await service.track(request(progress({ stepId: "timer_1" })))).toMatchObject({ success: false, status: 400 });
    expect(deps.events).toHaveLength(0);
  });

  it("outros eventos guardam videoSecond nulo mesmo se o cliente mandar", async () => {
    await createTrackService(deps).track(request(body({ type: "step_view", stepId: "vsl_1", videoSecond: 30 })));
    expect(deps.events[0]).toMatchObject({ type: "step_view", videoSecond: null });
  });
});
