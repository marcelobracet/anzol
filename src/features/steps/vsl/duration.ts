// Tempo digitado no Studio: "300", "300s", "2m30s", "1h2m3s", "2:30" ou "1:02:03".
const UNITS = /^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/;
const CLOCK = /^(?:(\d+):)?(\d+):(\d{2})$/;

export function parseDuration(input: string): number | null {
  const value = input.trim().toLowerCase();
  if (/^\d+$/.test(value)) return Number(value);

  const clock = CLOCK.exec(value);
  if (clock) {
    const [, h = "0", m, s] = clock;
    if (Number(s) > 59 || (clock[1] !== undefined && Number(m) > 59)) return null;
    return Number(h) * 3600 + Number(m) * 60 + Number(s);
  }

  const units = UNITS.exec(value);
  if (!units || !value || units.slice(1).every((part) => part === undefined)) return null;
  const [, h = "0", m = "0", s = "0"] = units;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [h ? `${h}h` : "", m ? `${m}m` : "", s ? `${s}s` : ""].join("");
  return parts || "0s";
}
