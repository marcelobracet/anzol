export type AutosaveStatus = "pending" | "saving" | "saved" | "error";
export type SaveOutcome = { success: true } | { success: false; error: string };

type Options<T> = {
  save: (value: T) => Promise<SaveOutcome>;
  delayMs: number;
  onStatus: (status: AutosaveStatus, error?: string) => void;
};

// Debounce + fila de um: nunca dois saves ao mesmo tempo (o lock otimista exige ordem).
export function createAutosaver<T>({ save, delayMs, onStatus }: Options<T>) {
  let pending: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<boolean> | null = null;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  async function saveOnce(value: T): Promise<boolean> {
    onStatus("saving");
    try {
      const outcome = await save(value);
      if (outcome.success) return true;
      onStatus("error", outcome.error);
    } catch (error) {
      onStatus("error", error instanceof Error ? error.message : "Falha ao salvar");
    }
    return false;
  }

  async function drain(): Promise<boolean> {
    let ok = true;
    while (pending && ok) {
      const { value } = pending;
      pending = null;
      ok = await saveOnce(value);
    }
    if (ok) onStatus(pending ? "pending" : "saved");
    return ok;
  }

  function run(): Promise<boolean> {
    clearTimer();
    if (inFlight) return inFlight.then((ok) => (ok && pending ? run() : ok));
    inFlight = drain().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  return {
    schedule(value: T) {
      pending = { value };
      onStatus("pending");
      clearTimer();
      timer = setTimeout(() => void run(), delayMs);
    },
    flush(): Promise<boolean> {
      if (!pending && !inFlight) return Promise.resolve(true);
      return run();
    },
    dispose() {
      clearTimer();
      pending = null;
    },
  };
}
