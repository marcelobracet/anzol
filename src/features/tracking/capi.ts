import { createHash } from "node:crypto";

export type MetaEventName = "PageView" | "ViewContent" | "Lead" | "InitiateCheckout";
const GRAPH_URL = "https://graph.facebook.com/v21.0";

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

type CapiInput = {
  eventName: MetaEventName;
  eventId: string;
  eventTime: number;
  sourceUrl: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  country?: string;
  lead?: { email?: string; phone?: string; name?: string };
};

// Normalização e hash conforme a Meta: minúsculas, sem espaços; telefone só com dígitos.
function hashedUserData({ lead, country }: Pick<CapiInput, "lead" | "country">) {
  const firstName = lead?.name?.trim().split(/\s+/)[0]?.toLowerCase();
  const entries: [string, string | undefined][] = [
    ["em", lead?.email?.trim().toLowerCase()],
    ["ph", lead?.phone?.replace(/\D/g, "")],
    ["fn", firstName],
    ["country", country?.toLowerCase()],
  ];
  return Object.fromEntries(entries.filter(([, v]) => v).map(([k, v]) => [k, [sha256(v!)]]));
}

export function buildCapiEvent(input: CapiInput) {
  const browser = Object.fromEntries(
    [
      ["client_ip_address", input.ip],
      ["client_user_agent", input.userAgent],
      ["fbp", input.fbp],
      ["fbc", input.fbc],
    ].filter(([, v]) => v),
  );
  return {
    event_name: input.eventName,
    event_id: input.eventId, // mesmo id do fbq: a Meta deduplica Pixel x CAPI
    event_time: input.eventTime,
    action_source: "website" as const,
    event_source_url: input.sourceUrl,
    user_data: { ...browser, ...hashedUserData(input) },
  };
}

export type CapiEvent = ReturnType<typeof buildCapiEvent>;

export async function sendCapiEvent(
  { pixelId, token, event }: { pixelId: string; token: string; event: CapiEvent },
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchFn(`${GRAPH_URL}/${encodeURIComponent(pixelId)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [event], access_token: token }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Meta CAPI HTTP ${response.status}`);
  }
}
