import { describe, expect, it, vi } from "vitest";
import { buildCapiEvent, sendCapiEvent, sha256 } from "./capi";

const base = {
  eventName: "Lead" as const,
  eventId: "6f1c2a3e-1111-4222-8333-944455556666",
  eventTime: 1_793_800_000,
  sourceUrl: "https://oferta.com/?utm_source=fb",
  ip: "200.1.2.3",
  userAgent: "Mozilla/5.0",
  fbp: "fb.1.1700000000.123",
  fbc: undefined,
};

describe("sha256", () => {
  it("hash hexadecimal minúsculo", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("buildCapiEvent", () => {
  it("usa o mesmo event_id do Pixel e dados de navegador sem hash", () => {
    const event = buildCapiEvent(base);
    expect(event).toMatchObject({
      event_name: "Lead",
      event_id: base.eventId,
      event_time: base.eventTime,
      action_source: "website",
      event_source_url: base.sourceUrl,
      user_data: { client_ip_address: "200.1.2.3", client_user_agent: "Mozilla/5.0", fbp: "fb.1.1700000000.123" },
    });
    expect(event.user_data).not.toHaveProperty("fbc");
  });

  it("dados pessoais vão com SHA-256 normalizado; telefone sem +", () => {
    const event = buildCapiEvent({ ...base, lead: { email: "ana@mail.com", phone: "+525512345678", name: "Ana Maria" }, country: "MX" });
    expect(event.user_data).toMatchObject({
      em: [sha256("ana@mail.com")],
      ph: [sha256("525512345678")],
      fn: [sha256("ana")],
      country: [sha256("mx")],
    });
  });
});

describe("sendCapiEvent", () => {
  it("envia para o pixel com o token no corpo, nunca na URL", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    await sendCapiEvent({ pixelId: "123456", token: "SECRET", event: buildCapiEvent(base) }, fetchFn);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v21.0/123456/events");
    expect(url).not.toContain("SECRET");
    expect(JSON.parse(init.body)).toMatchObject({ access_token: "SECRET", data: [{ event_id: base.eventId }] });
  });

  it("erro da Meta vira exceção com a mensagem", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Invalid token" } }), { status: 400 }));
    await expect(sendCapiEvent({ pixelId: "1", token: "t", event: buildCapiEvent(base) }, fetchFn)).rejects.toThrow("Invalid token");
  });
});
