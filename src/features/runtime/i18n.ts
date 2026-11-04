const MESSAGES = {
  pt: {
    back: "Voltar",
    continue: "Continuar",
    justBought: "{name}, de {city}, acabou de comprar",
    justBoughtNoCity: "{name} acabou de comprar",
    tapToUnmute: "Toque para ativar o som",
    days: "dias",
    hours: "horas",
    minutes: "min",
    seconds: "seg",
  },
  es: {
    back: "Volver",
    continue: "Continuar",
    justBought: "{name}, de {city}, acaba de comprar",
    justBoughtNoCity: "{name} acaba de comprar",
    tapToUnmute: "Toca para activar el sonido",
    days: "días",
    hours: "horas",
    minutes: "min",
    seconds: "seg",
  },
  en: {
    back: "Back",
    continue: "Continue",
    justBought: "{name} from {city} just bought",
    justBoughtNoCity: "{name} just bought",
    tapToUnmute: "Tap to turn on sound",
    days: "days",
    hours: "hours",
    minutes: "min",
    seconds: "sec",
  },
  de: {
    back: "Zurück",
    continue: "Weiter",
    justBought: "{name} aus {city} hat gerade gekauft",
    justBoughtNoCity: "{name} hat gerade gekauft",
    tapToUnmute: "Tippen, um den Ton einzuschalten",
    days: "Tage",
    hours: "Std",
    minutes: "Min",
    seconds: "Sek",
  },
  fr: {
    back: "Retour",
    continue: "Continuer",
    justBought: "{name}, de {city}, vient d'acheter",
    justBoughtNoCity: "{name} vient d'acheter",
    tapToUnmute: "Touchez pour activer le son",
    days: "jours",
    hours: "heures",
    minutes: "min",
    seconds: "s",
  },
  it: {
    back: "Indietro",
    continue: "Continua",
    justBought: "{name} da {city} ha appena acquistato",
    justBoughtNoCity: "{name} ha appena acquistato",
    tapToUnmute: "Tocca per attivare l'audio",
    days: "giorni",
    hours: "ore",
    minutes: "min",
    seconds: "sec",
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)["en"];
type Language = keyof typeof MESSAGES;

function language(locale: string): Language {
  const lang = locale.slice(0, 2).toLowerCase();
  return lang in MESSAGES ? (lang as Language) : "en";
}

// Textos fixos do runtime no idioma do quiz. Os textos do quiz em si vêm do documento.
export function t(locale: string, key: MessageKey, vars: Record<string, string> = {}): string {
  return MESSAGES[language(locale)][key].replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

export function relativeTime(minutesAgo: number, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (minutesAgo < 1) return format.format(0, "second");
  if (minutesAgo < 60) return format.format(-Math.round(minutesAgo), "minute");
  return format.format(-Math.round(minutesAgo / 60), "hour");
}
