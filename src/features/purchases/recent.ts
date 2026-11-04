import { z } from "zod";

export type ToastItem = { firstName: string; city?: string; country?: string; minutesAgo: number };

const MAX_ITEMS = 10;

const Row = z.object({
  first_name: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  created_at: z.string(),
});

const firstWord = (name: string) => {
  const word = name.trim().split(/\s+/)[0] ?? "";
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
};

// Só dados reais da tabela purchases, e só o mínimo: primeiro nome, cidade, país.
export function toToastItems(rows: unknown[], now: Date): ToastItem[] {
  return rows
    .flatMap((raw) => {
      const row = Row.safeParse(raw);
      if (!row.success) return [];
      const firstName = firstWord(row.data.first_name ?? "");
      if (!firstName) return [];
      const minutesAgo = Math.max(0, Math.round((now.getTime() - new Date(row.data.created_at).getTime()) / 60_000));
      return [{ firstName, city: row.data.city ?? undefined, country: row.data.country ?? undefined, minutesAgo }];
    })
    .slice(0, MAX_ITEMS);
}

const Query = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60).nullable(),
  hours: z.coerce.number().int().min(1).max(168).default(48),
});

export function parseRecentQuery(params: URLSearchParams): { slug: string | null; hours: number } | null {
  const result = Query.safeParse({ slug: params.get("slug"), hours: params.get("hours") ?? undefined });
  return result.success ? result.data : null;
}
