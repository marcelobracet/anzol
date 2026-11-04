import { describe, expect, it } from "vitest";
import { parseRichText } from "./rich-text";

describe("parseRichText", () => {
  it("texto simples vira um parágrafo de uma linha", () => {
    expect(parseRichText("Olá")).toEqual([[[{ type: "text", text: "Olá" }]]]);
  });

  it("reconhece negrito, itálico e destaque", () => {
    expect(parseRichText("a **b** _c_ *d* ==e==")).toEqual([
      [
        [
          { type: "text", text: "a " },
          { type: "strong", text: "b" },
          { type: "text", text: " " },
          { type: "em", text: "c" },
          { type: "text", text: " " },
          { type: "em", text: "d" },
          { type: "text", text: " " },
          { type: "mark", text: "e" },
        ],
      ],
    ]);
  });

  it("quebra de linha separa linhas e linha em branco separa parágrafos", () => {
    const result = parseRichText("um\ndois\n\ntrês");
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toEqual([[{ type: "text", text: "três" }]]);
  });

  it("marcadores sem fechamento ficam como texto", () => {
    expect(parseRichText("2 ** 3")).toEqual([[[{ type: "text", text: "2 ** 3" }]]]);
  });

  it("nunca interpreta HTML: tags ficam como texto", () => {
    expect(parseRichText("<script>x</script>")).toEqual([[[{ type: "text", text: "<script>x</script>" }]]]);
  });

  it("vazio não gera parágrafos", () => {
    expect(parseRichText("  \n\n ")).toEqual([]);
  });
});
