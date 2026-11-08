import { z } from "zod";
import { Step } from "@/features/steps/schema";
import { Hex, HttpsUrl, Id, ImageMedia, newId } from "@/features/steps/shared/primitives";

export const SCHEMA_VERSION = 1 as const;

export const Theme = z.object({
  colors: z.object({ primary: Hex, background: Hex, surface: Hex, text: Hex, accent: Hex }),
  font: z.enum(["inter", "manrope", "poppins", "dm-sans", "lora"]), // lista curada (next/font)
  logo: ImageMedia.optional(),
  radius: z.number().int().min(0).max(32),
});
export type Theme = z.infer<typeof Theme>;

// Destino do checkout. A promoção só existe com expiração real.
export const Offer = z.object({
  id: Id,
  provider: z.enum(["hotmart", "kiwify"]),
  // Liga a compra do webhook a esta oferta (e ao quiz).
  productId: z.string().trim().min(1).max(64).optional(),
  fullPriceUrl: HttpsUrl,
  promo: z.object({ url: HttpsUrl, expiresAt: z.iso.datetime({ offset: true }) }).optional(),
});
export type Offer = z.infer<typeof Offer>;

type Issue = { message: string; path: (string | number)[] };

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
}

function integrityIssues(doc: { steps: Step[]; offers: Offer[] }): Issue[] {
  const issues: Issue[] = [];
  for (const id of findDuplicates(doc.steps.map((s) => s.id))) {
    issues.push({ message: `Id de step duplicado: ${id}`, path: ["steps"] });
  }
  for (const id of findDuplicates(doc.offers.map((o) => o.id))) {
    issues.push({ message: `Id de oferta duplicado: ${id}`, path: ["offers"] });
  }
  const offerIds = new Set(doc.offers.map((o) => o.id));
  doc.steps.forEach((step, index) => {
    if (step.type === "question") {
      for (const id of findDuplicates(step.options.map((o) => o.id))) {
        issues.push({ message: `Id de opção duplicado: ${id}`, path: ["steps", index, "options"] });
      }
    }
    const offerId = step.type === "vsl" ? step.cta.offerId : step.type === "offerTimer" ? step.offerId : null;
    if (offerId && !offerIds.has(offerId)) {
      issues.push({ message: `Oferta inexistente: ${offerId}`, path: ["steps", index] });
    }
  });
  return issues;
}

export const QuizDocument = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    theme: Theme,
    offers: z.array(Offer).max(5).default([]),
    settings: z
      .object({
        showProgress: z.boolean().default(true),
        allowBack: z.boolean().default(true),
        // "vsl": a página é só a VSL (os outros steps ficam guardados, mas não aparecem).
        mode: z.enum(["quiz", "vsl"]).default("quiz"),
      })
      .default({ showProgress: true, allowBack: true, mode: "quiz" }),
    tracking: z
      .object({ metaPixelId: z.string().regex(/^\d{5,20}$/, "Pixel ID: só números").optional() })
      .default({}),
    steps: z.array(Step).min(1).max(60),
  })
  .superRefine((doc, ctx) => {
    for (const issue of integrityIssues(doc)) ctx.addIssue({ code: "custom", ...issue });
  });
export type QuizDocument = z.infer<typeof QuizDocument>;

export type ParseResult =
  | { success: true; data: QuizDocument }
  | { success: false; error: string; issues?: z.core.$ZodIssue[] };

// Migrações vN -> vN+1 entram aqui quando SCHEMA_VERSION subir.
const MIGRATIONS: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {};

export function parseDocument(raw: unknown): ParseResult {
  if (typeof raw !== "object" || raw === null) return { success: false, error: "Documento inválido" };
  let doc = raw as Record<string, unknown>;
  let version = doc.schemaVersion;
  while (typeof version === "number" && version < SCHEMA_VERSION && MIGRATIONS[version]) {
    doc = MIGRATIONS[version](doc);
    version = doc.schemaVersion;
  }
  if (version !== SCHEMA_VERSION) {
    return { success: false, error: `schemaVersion ${String(version)} não suportado` };
  }
  const result = QuizDocument.safeParse(doc);
  if (!result.success) {
    return { success: false, error: "Documento inválido", issues: result.error.issues };
  }
  return { success: true, data: result.data };
}

export const DEFAULT_THEME: Theme = {
  colors: {
    primary: "#2563EB",
    background: "#FFFFFF",
    surface: "#F4F4F5",
    text: "#18181B",
    accent: "#F59E0B",
  },
  font: "inter",
  radius: 12,
};

export function createEmptyDocument(): QuizDocument {
  return QuizDocument.parse({
    schemaVersion: SCHEMA_VERSION,
    theme: DEFAULT_THEME,
    steps: [
      {
        id: newId(),
        type: "info",
        name: "Boas-vindas",
        title: "Descubra seu perfil em 1 minuto",
        ctaLabel: "Começar",
      },
    ],
  });
}
