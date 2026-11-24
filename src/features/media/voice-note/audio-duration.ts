// Duração do áudio lida no navegador, antes do envio (o R2 só guarda o arquivo).
export const MAX_AUDIO_SECONDS = 600;

/** Arredonda para 0,1 s e valida o intervalo aceito pelo schema. */
export function normalizeDuration(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("Não consegui ler a duração do áudio. Exporte em MP3 e tente de novo.");
  if (seconds > MAX_AUDIO_SECONDS) throw new Error("Áudio acima de 10 minutos");
  return Math.max(0.1, Math.round(seconds * 10) / 10);
}

export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (fn: () => void) => {
      URL.revokeObjectURL(url);
      fn();
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      try {
        const seconds = normalizeDuration(audio.duration);
        done(() => resolve(seconds));
      } catch (e) {
        done(() => reject(e));
      }
    };
    audio.onerror = () => done(() => reject(new Error("Arquivo de áudio inválido ou não suportado pelo navegador")));
    audio.src = url;
  });
}
