import { describe, expect, it } from "vitest";
import { parseThemePref, resolveTheme } from "./theme-pref";

describe("parseThemePref", () => {
  it("aceita light, dark e system; o resto vira system", () => {
    expect(parseThemePref("light")).toBe("light");
    expect(parseThemePref("dark")).toBe("dark");
    expect(parseThemePref("system")).toBe("system");
    expect(parseThemePref(undefined)).toBe("system");
    expect(parseThemePref("roxo")).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("escolha explícita vence a preferência do sistema", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("system segue o sistema", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});
