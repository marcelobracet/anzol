import { describe, expect, it } from "vitest";
import { QuizDocument } from "@/features/quiz/document/schema";
import { fullDocumentInput } from "@/features/quiz/document/fixtures";
import { responsesCsv } from "./csv";

describe("CSV das respostas", () => {
  const steps = QuizDocument.parse(fullDocumentInput()).steps;
  const row = {
    sessionId: "s1",
    startedAt: null,
    lastAt: "2026-11-23T12:00:00Z",
    stepsViewed: 4,
    answers: { q_age: ["opt_30"] },
    lead: { name: "=HYPERLINK(\"x\")", email: "ana@exemplo.com", phone: "+5215512345678" },
    utm: { utm_content: "criativo, 3" },
  };

  it("uma coluna por pergunta, com BOM e sem injeção de fórmula", () => {
    const csv = responsesCsv(steps, [row]);
    expect(csv.startsWith("﻿data,nome,email,telefone")).toBe(true);
    expect(csv).toContain("Qual a sua idade?");
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`); // fórmula neutralizada e escapada
    expect(csv).toContain("'+5215512345678"); // telefone com + também
    expect(csv).toContain('"criativo, 3"');
    expect(csv.split("\r\n")[1].endsWith(",30+")).toBe(true);
  });
});
