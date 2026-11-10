export const THEME_PREFS = ["light", "dark", "system"] as const;
export type ThemePref = (typeof THEME_PREFS)[number];
export type ResolvedTheme = "light" | "dark";

export const THEME_COOKIE = "anzol-studio-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseThemePref(value: string | undefined): ThemePref {
  return THEME_PREFS.find((p) => p === value) ?? "system";
}

export function resolveTheme(pref: ThemePref, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === "system") return systemPrefersDark ? "dark" : "light";
  return pref;
}
