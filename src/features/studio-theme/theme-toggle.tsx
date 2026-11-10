"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { resolveTheme, THEME_COOKIE, THEME_COOKIE_MAX_AGE, type ThemePref } from "./theme-pref";

const OPTIONS = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const;

function applyTheme(pref: ThemePref) {
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  const dark = resolveTheme(pref, window.matchMedia("(prefers-color-scheme: dark)").matches) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

// applyTheme salva a escolha em cookie para o servidor já renderizar no tema certo (sem piscar).
export function ThemeToggle({ initial }: { initial: ThemePref }) {
  const [pref, setPref] = useState(initial);

  const choose = (next: ThemePref) => {
    setPref(next);
    applyTheme(next);
  };

  return (
    <div role="radiogroup" aria-label="Tema" className="flex items-center rounded-lg border bg-muted/50 p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          title={label}
          onClick={() => choose(value)}
          className={`grid size-7 place-items-center rounded-md transition-colors ${
            pref === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
