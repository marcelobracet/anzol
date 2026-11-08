import { describe, expect, it } from "vitest";
import { QuizDocument } from "@/features/quiz/document/schema";
import { demoDocument } from "@/features/runtime/demo-document";
import { Step } from "@/features/steps/schema";
import {
  ADDABLE_STEP_TYPES,
  addStep,
  defaultStep,
  duplicateStep,
  issuesByStep,
  moveStep,
  removeStep,
  replaceStep,
  toggleHidden,
  updateTheme,
} from "./document-ops";

const doc = demoDocument();
const ids = (d: QuizDocument) => d.steps.map((s) => s.id);

describe("defaultStep", () => {
  it.each(ADDABLE_STEP_TYPES.filter((t) => t !== "vsl" && t !== "socialProof"))("%s nasce válido", (type) => {
    expect(Step.safeParse(defaultStep(type, "offer_x")).success).toBe(true);
  });

  it("captura de lead e prova social estão disponíveis", () => {
    expect(ADDABLE_STEP_TYPES).toEqual(expect.arrayContaining(["leadForm", "socialProof"]));
  });

  it("prova social nasce sem depoimentos e só a lista fica inválida", () => {
    const result = Step.safeParse(defaultStep("socialProof"));
    expect(result.error?.issues.every((i) => i.path[0] === "items")).toBe(true);
  });

  it("VSL nasce válida, sem vídeo (espaço reservado) e em pé", () => {
    const result = Step.safeParse(defaultStep("vsl", "offer_x"));
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ aspect: "9:16" });
    expect(result.data).not.toHaveProperty("video");
  });
});

describe("addStep", () => {
  it("insere depois do step indicado e devolve o id novo", () => {
    const { doc: next, id } = addStep(doc, "info", "q_goal")!;
    expect(ids(next).indexOf(id)).toBe(ids(doc).indexOf("q_goal") + 1);
    expect(next.steps).toHaveLength(doc.steps.length + 1);
  });

  it("sem referência insere no fim", () => {
    const { doc: next, id } = addStep(doc, "question")!;
    expect(ids(next).at(-1)).toBe(id);
  });

  it("não altera o documento original", () => {
    addStep(doc, "info");
    expect(doc.steps).toHaveLength(demoDocument().steps.length);
  });
});

describe("removeStep", () => {
  it("remove pelo id", () => {
    expect(ids(removeStep(doc, "loading"))).not.toContain("loading");
  });

  it("não remove o último step restante", () => {
    const single = { ...doc, steps: doc.steps.slice(0, 1) };
    expect(removeStep(single, single.steps[0].id).steps).toHaveLength(1);
  });
});

describe("duplicateStep", () => {
  it("copia logo depois com ids novos no step e nas opções", () => {
    const { doc: next, id } = duplicateStep(doc, "q_goal");
    const original = next.steps.find((s) => s.id === "q_goal")!;
    const copy = next.steps.find((s) => s.id === id)!;
    expect(ids(next).indexOf(id)).toBe(ids(next).indexOf("q_goal") + 1);
    expect(copy.type === "question" && original.type === "question").toBe(true);
    if (copy.type !== "question" || original.type !== "question") return;
    expect(copy.options.map((o) => o.label)).toEqual(original.options.map((o) => o.label));
    expect(copy.options.some((o) => original.options.some((p) => p.id === o.id))).toBe(false);
    expect(QuizDocument.safeParse(next).success).toBe(true);
  });

  it("gera ids novos para variantes de resultado", () => {
    const { doc: next } = duplicateStep(doc, "result");
    expect(QuizDocument.safeParse(next).success).toBe(true);
  });
});

describe("moveStep", () => {
  it("move para a posição do alvo", () => {
    expect(ids(moveStep(doc, "result", "intro"))).toEqual(["result", "intro", "q_goal", "q_blockers", "loading"]);
    expect(ids(moveStep(doc, "intro", "q_blockers"))).toEqual(["q_goal", "q_blockers", "intro", "loading", "result"]);
  });

  it("ids desconhecidos não mudam nada", () => {
    expect(moveStep(doc, "x", "intro")).toBe(doc);
  });
});

describe("replaceStep / toggleHidden / updateTheme", () => {
  it("substitui o step com o mesmo id", () => {
    const step = { ...doc.steps[0], name: "Novo nome" };
    expect(replaceStep(doc, step).steps[0].name).toBe("Novo nome");
  });

  it("alterna hidden", () => {
    expect(toggleHidden(doc, "intro").steps[0].hidden).toBe(true);
    expect(toggleHidden(toggleHidden(doc, "intro"), "intro").steps[0].hidden).toBe(false);
  });

  it("troca o tema", () => {
    const theme = { ...doc.theme, radius: 0 };
    expect(updateTheme(doc, theme).theme.radius).toBe(0);
  });
});

describe("issuesByStep", () => {
  it("documento válido não tem problemas", () => {
    expect(issuesByStep(doc)).toEqual({});
  });

  it("agrupa os problemas pelo id do step, com o caminho do campo", () => {
    const broken = replaceStep(doc, { ...doc.steps[0], type: "info", title: "" } as Step);
    const issues = issuesByStep(broken);
    expect(Object.keys(issues)).toEqual(["intro"]);
    expect(issues.intro[0].path).toEqual(["title"]);
  });

  it("problemas fora dos steps ficam em _doc", () => {
    const broken = updateTheme(doc, { ...doc.theme, colors: { ...doc.theme.colors, primary: "red" } });
    expect(issuesByStep(broken)._doc?.[0].path).toEqual(["theme", "colors", "primary"]);
  });
});

describe("errorAt", () => {
  it("acha a mensagem do campo pelo caminho exato", async () => {
    const { errorAt } = await import("./document-ops");
    const issues = [{ path: ["options", 0, "label"], message: "Obrigatório" }];
    expect(errorAt(issues, "options", 0, "label")).toBe("Obrigatório");
    expect(errorAt(issues, "options", 1, "label")).toBeUndefined();
    expect(errorAt(undefined, "title")).toBeUndefined();
  });
});
