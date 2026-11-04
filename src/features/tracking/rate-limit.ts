type Options = { limit: number; windowMs: number; now?: () => number; maxKeys?: number };

// Limite por instância (Fluid Compute reaproveita instâncias). Barreira contra abuso simples;
// volume alto deve ser barrado no firewall da Vercel.
export function createRateLimiter({ limit, windowMs, now = Date.now, maxKeys = 10_000 }: Options) {
  const windows = new Map<string, { start: number; count: number }>();

  function prune(at: number) {
    for (const [key, w] of windows) if (at - w.start >= windowMs) windows.delete(key);
    while (windows.size >= maxKeys) windows.delete(windows.keys().next().value!);
  }

  return {
    allow(key: string): boolean {
      const at = now();
      const current = windows.get(key);
      if (!current || at - current.start >= windowMs) {
        if (!current) prune(at);
        windows.set(key, { start: at, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
    size: () => windows.size,
  };
}
