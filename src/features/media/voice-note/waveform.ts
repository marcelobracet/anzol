// Barras do áudio no estilo WhatsApp. Geradas a partir do id do arquivo (sempre iguais para o mesmo áudio),
// sem baixar e decodificar o arquivo inteiro só para desenhar.

export const BAR_COUNT = 34;

// FNV-1a 32 bits: hash simples e estável para semear o gerador.
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Mulberry32: gerador pseudoaleatório pequeno e determinístico.
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Alturas entre 0.15 e 1, com começo e fim mais baixos (como uma fala real). */
export function waveformBars(seed: string, count = BAR_COUNT): number[] {
  const rnd = random(hash(seed));
  return Array.from({ length: count }, (_, i) => {
    const edge = Math.min(1, (i + 1) / 4, (count - i) / 4); // rampa nas pontas
    const value = 0.25 + rnd() * 0.75;
    return Math.round(Math.max(0.15, value * edge) * 100) / 100;
  });
}

/** 7 → "0:07"; 75.4 → "1:15". */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const SPEEDS = [1, 1.5, 2] as const;
export function nextSpeed(current: number): (typeof SPEEDS)[number] {
  const index = SPEEDS.indexOf(current as (typeof SPEEDS)[number]);
  return SPEEDS[(index + 1) % SPEEDS.length];
}
