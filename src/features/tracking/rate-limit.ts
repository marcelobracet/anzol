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

type TrackLimiterOptions = { eventsPerMinute: number; progressPerMinute: number; now?: () => number };

// Duas cotas por IP: o progresso do vídeo (vários eventos por minuto por pessoa) não pode gastar a cota de
// lead/checkout, e precisa de folga para muita gente atrás do mesmo IP (CGNAT de operadora móvel).
export function createTrackLimiter({ eventsPerMinute, progressPerMinute, now }: TrackLimiterOptions) {
  const events = createRateLimiter({ limit: eventsPerMinute, windowMs: 60_000, now });
  const progress = createRateLimiter({ limit: progressPerMinute, windowMs: 60_000, now });
  return {
    allow: (ip: string, type: string | undefined) => (type === "vsl_progress" ? progress : events).allow(ip),
  };
}
