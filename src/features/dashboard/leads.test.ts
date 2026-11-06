import { describe, expect, it } from "vitest";
import { demoDocument } from "@/features/runtime/demo-document";
import { playableSteps } from "@/features/runtime/engine";
import { LeadFormStep } from "@/features/steps/lead-form/schema";
import {
  cellsFor,
  computeKpis,
  ilikePattern,
  kpiThresholds,
  matchesSearch,
  matchingOptionIds,
  summarizeSessions,
  type SessionRow,
} from "./leads";

const leadStep = LeadFormStep.parse({
  id: "lead_form",
  type: "leadForm",
  name: "Contato",
  title: "Seus dados",
  fields: {
    name: { enabled: true, required: true, label: "Nome" },
    email: { enabled: true, required: true, label: "E-mail" },
    phone: { enabled: true, required: false, label: "WhatsApp" },
  },
  ctaLabel: "Enviar",
});
// intro, q_goal, q_blockers, loading, result + formulário = 6 steps
const steps = [...playableSteps(demoDocument()), leadStep];

const at = (minute: number) => `2026-11-04T12:${String(minute).padStart(2, "0")}:00.000Z`;
const view = (sessionId: string, stepId: string, minute: number) => ({ sessionId, stepId, type: "step_view", answer: null, utm: {}, createdAt: at(minute) });

describe("kpiThresholds", () => {
  it("qualificado = metade dos steps (mínimo 2); completo = viu o último", () => {
    expect(kpiThresholds(steps)).toEqual({ qualifiedMin: 3, lastStepId: "lead_form" });
    expect(kpiThresholds(steps.slice(0, 1))).toEqual({ qualifiedMin: 2, lastStepId: "intro" });
  });
});

describe("summarizeSessions", () => {
  const events = [
    { ...view("s1", "intro", 1), utm: { utm_source: "fb" } },
    view("s1", "q_goal", 2),
    { sessionId: "s1", stepId: "q_goal", type: "answer", answer: { optionIds: ["goal_time"] }, utm: {}, createdAt: at(3) },
    { sessionId: "s1", stepId: "q_goal", type: "answer", answer: { optionIds: ["goal_both"] }, utm: {}, createdAt: at(4) },
    { sessionId: "s1", stepId: "result", type: "checkout_click", answer: null, utm: {}, createdAt: at(5) },
    view("s2", "intro", 10),
  ];
  const leads = [{ sessionId: "s1", name: "Ana", email: "ana@x.com", phoneE164: "+5511999999999", createdAt: at(6) }];
  const rows = summarizeSessions(events, leads);

  it("uma linha por sessão, mais recente primeiro, com a última resposta de cada pergunta", () => {
    expect(rows.map((r) => r.sessionId)).toEqual(["s2", "s1"]);
    expect(rows[1]).toEqual({
      sessionId: "s1",
      startedAt: at(1),
      utm: { utm_source: "fb" },
      viewed: ["intro", "q_goal"],
      answers: { q_goal: ["goal_both"] },
      checkout: true,
      lead: { name: "Ana", email: "ana@x.com", phone: "+5511999999999" },
    });
    expect(rows[0].lead).toBeNull();
  });

  it("KPIs: visitantes, interagiram (passou do 1º step), qualificados, completos e contatos", () => {
    const kpis = computeKpis(rows, kpiThresholds(steps));
    expect(kpis).toEqual({ visitors: 2, interacted: 1, interactionRate: 0.5, qualified: 0, completed: 0, contacts: 1 });
    expect(computeKpis([], kpiThresholds(steps)).interactionRate).toBe(0);
  });
});

const row = (over: Partial<SessionRow> = {}): SessionRow => ({
  sessionId: "s1",
  startedAt: at(1),
  utm: {},
  viewed: ["intro", "q_goal", "q_blockers", "loading"],
  answers: { q_goal: ["goal_money"], q_blockers: ["b_focus", "b_time"] },
  checkout: false,
  lead: null,
  ...over,
});

describe("cellsFor", () => {
  it("pergunta mostra os textos; step visto sem resposta mostra 'visto'; não visto fica vazio", () => {
    expect(cellsFor(steps, row())).toEqual(["visto", "Ganhar mais dinheiro", "Falta de foco, Pouco tempo", "visto", "", ""]);
  });

  it("formulário mostra os dados do lead; opção removida aparece pelo id", () => {
    const lead = { name: "Ana", email: "ana@x.com", phone: null };
    expect(cellsFor(steps, row({ lead, answers: { q_goal: ["sumiu"] } })).slice(1, 2)).toEqual(["sumiu"]);
    expect(cellsFor(steps, row({ lead })).at(-1)).toBe("Ana · ana@x.com");
  });
});

describe("busca", () => {
  it("acha opções pelo texto, sem acento e sem caixa", () => {
    expect(matchingOptionIds(steps, "TEMPO")).toEqual(["goal_time", "b_time"]);
    expect(matchingOptionIds(steps, "metodo")).toEqual(["b_method"]);
    expect(matchingOptionIds(steps, "")).toEqual([]);
  });

  it("filtra sessões por resposta ou por dado do lead", () => {
    const lead = { name: "Ana Souza", email: "ana@x.com", phone: "+5511988887777" };
    expect(matchesSearch(row(), steps, "pouco tempo")).toBe(true);
    expect(matchesSearch(row({ lead }), steps, "souza")).toBe(true);
    expect(matchesSearch(row({ lead }), steps, "98888")).toBe(true);
    expect(matchesSearch(row(), steps, "medo")).toBe(false);
    expect(matchesSearch(row(), steps, "")).toBe(true);
  });

  it("escapa curingas do ILIKE", () => {
    expect(ilikePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });
});
