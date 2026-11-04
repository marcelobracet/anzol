import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInMemoryDomainRepository } from "./in-memory-repository";
import type { DomainRepository } from "./repository";
import { createDomainService, type DomainService } from "./service";

const QUIZ = "6f1c2a3e-1111-4222-8333-944455556666";
const OTHER = "7a1c2a3e-1111-4222-8333-944455556666";
const routing = { studioHost: "anzol.marcelobracet.com.br", blockedHosts: ["marcelobracet.com.br"] };

let repo: DomainRepository;
let vercel: { add: ReturnType<typeof vi.fn> };
let service: DomainService;

beforeEach(() => {
  repo = createInMemoryDomainRepository();
  vercel = { add: vi.fn().mockResolvedValue({ verified: true, verification: [] }) };
  service = createDomainService(repo, vercel, routing);
});

describe("add", () => {
  it("normaliza, cadastra na Vercel e liga ao quiz", async () => {
    const result = await service.add(QUIZ, " Oferta.COM. ", false);
    expect(result).toEqual({ success: true, data: { host: "oferta.com", verified: true, verification: [] } });
    expect(vercel.add).toHaveBeenCalledWith("oferta.com");
    expect(await service.listForQuiz(QUIZ)).toEqual([{ host: "oferta.com", isDefault: false }]);
  });

  it("marca como quiz padrão do domínio", async () => {
    await service.add(QUIZ, "oferta.com", true);
    expect(await service.listForQuiz(QUIZ)).toEqual([{ host: "oferta.com", isDefault: true }]);
    expect(await repo.hostsForQuiz(QUIZ)).toEqual(["oferta.com"]);
  });

  it.each([
    ["anzol.marcelobracet.com.br", /Studio/],
    ["marcelobracet.com.br", /bloqueado/],
    ["quiz.marcelobracet.com.br", /bloqueado/],
    ["localhost", /inválido/],
    ["não é host", /inválido/],
  ])("recusa %s", async (host, message) => {
    const result = await service.add(QUIZ, host, false);
    expect(result.success).toBe(false);
    expect(!result.success && result.error).toMatch(message);
    expect(vercel.add).not.toHaveBeenCalled();
  });

  it("falha da Vercel não liga o domínio", async () => {
    vercel.add.mockRejectedValue(new Error("Domain is in use"));
    const result = await service.add(QUIZ, "oferta.com", false);
    expect(result).toEqual({ success: false, error: "Vercel: Domain is in use" });
    expect(await service.listForQuiz(QUIZ)).toEqual([]);
  });
});

describe("remove", () => {
  it("desliga o domínio e limpa o padrão se era deste quiz", async () => {
    await service.add(QUIZ, "oferta.com", true);
    await service.add(OTHER, "oferta.com", false);
    await service.remove(QUIZ, "oferta.com");
    expect(await service.listForQuiz(QUIZ)).toEqual([]);
    expect(await repo.hostsForQuiz(QUIZ)).toEqual([]);
    expect(await service.listForQuiz(OTHER)).toEqual([{ host: "oferta.com", isDefault: false }]);
  });
});
