// EEE (UE + Islândia, Liechtenstein, Noruega) + Reino Unido + Suíça.
const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

export function isEuCountry(country: string | null | undefined): boolean {
  return Boolean(country) && EU_COUNTRIES.has(country!.toUpperCase());
}

export function isEuLocale(locale: string): boolean {
  return isEuCountry(locale.split("-")[1]);
}

// Pixel e CAPI só com consentimento quando o quiz é europeu OU o visitante está no EEE/UK/CH.
export function consentRequired({ locale, country }: { locale: string; country: string | null }): boolean {
  return isEuLocale(locale) || isEuCountry(country);
}
