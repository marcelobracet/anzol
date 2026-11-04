import { describe, expect, it } from "vitest";
import { DEFAULT_THEME } from "@/features/quiz/document/schema";
import { readableOn, themeStyle } from "./theme";

describe("readableOn", () => {
  it("texto branco sobre cor escura e preto sobre cor clara", () => {
    expect(readableOn("#18181B")).toBe("#FFFFFF");
    expect(readableOn("#2563EB")).toBe("#FFFFFF");
    expect(readableOn("#FDE047")).toBe("#000000");
    expect(readableOn("#FFFFFF")).toBe("#000000");
  });
});

describe("themeStyle", () => {
  it("expõe as cores e o raio como variáveis CSS", () => {
    expect(themeStyle(DEFAULT_THEME)).toEqual({
      "--q-primary": "#2563EB",
      "--q-on-primary": "#FFFFFF",
      "--q-bg": "#FFFFFF",
      "--q-surface": "#F4F4F5",
      "--q-text": "#18181B",
      "--q-accent": "#F59E0B",
      "--q-on-accent": "#000000",
      "--q-radius": "12px",
    });
  });
});
