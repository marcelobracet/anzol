// Som de fundo do áudio, para não soar como gravação de estúdio.
// "room": ruído marrom filtrado, gerado no navegador (sem arquivo). "file": áudio em loop (ex.: pessoas conversando).

export type Ambience = { play: () => void; pause: () => void; dispose: () => void };

/** Volume do Studio (0 a 100) → ganho. Fundo sempre baixo: no máximo 35% do volume da voz. */
export function ambienceGain(volume: number): number {
  return (Math.min(100, Math.max(0, volume)) / 100) * 0.35;
}

function roomNoise(volume: number): Ambience {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return { play() {}, pause() {}, dispose() {} };
  const ctx = new Ctx();
  // 4 s de ruído marrom (integração do ruído branco): grave e abafado, como uma sala.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const gain = ctx.createGain();
  gain.gain.value = ambienceGain(volume);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  void ctx.suspend();
  return {
    play: () => void ctx.resume(),
    pause: () => void ctx.suspend(),
    dispose: () => void ctx.close(),
  };
}

function fileLoop(url: string, volume: number): Ambience {
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = ambienceGain(volume);
  audio.preload = "auto";
  return {
    play: () => void audio.play().catch(() => {}),
    pause: () => audio.pause(),
    dispose: () => {
      audio.pause();
      audio.src = "";
    },
  };
}

// Criado no primeiro toque (o navegador só libera áudio depois de uma interação).
export function createAmbience(kind: "none" | "room" | "file", volume: number, fileUrl?: string): Ambience | null {
  if (kind === "room" && volume > 0) return roomNoise(volume);
  if (kind === "file" && fileUrl && volume > 0) return fileLoop(fileUrl, volume);
  return null;
}
