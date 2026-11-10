import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/features/steps/vsl/duration";
import type { Retention } from "../retention";

type Props = { title: string; retention: Retention; ctaAt: number };

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const W = 600;
const H = 180;

// Curva de retenção: % de quem deu play que ainda assistia em cada momento do vídeo.
export function RetentionCard({ title, retention, ctaAt }: Props) {
  const { points } = retention;
  const lastSecond = points.at(-1)?.second ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retenção do vídeo · {title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        {retention.starts === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda sem dados. A retenção começa a contar quando alguém toca no vídeo para ouvir
            {retention.views > 0 ? ` (${retention.views.toLocaleString("pt-BR")} viram a página, ninguém deu play ainda).` : "."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Deram play" value={retention.starts.toLocaleString("pt-BR")} hint={`${pct(retention.playRate)} de quem viu a página`} />
              <Stat label="Metade saiu aos" value={retention.halfSecond === null ? "—" : formatDuration(retention.halfSecond)} />
              <Stat label={`Chegaram ao botão (${formatDuration(ctaAt)})`} value={pct(retention.reachedCta)} />
              <Stat label="Assistiram até o fim medido" value={pct(points.at(-1)?.share ?? 0)} hint={formatDuration(lastSecond)} />
            </div>
            <Chart retention={retention} ctaAt={ctaAt} lastSecond={lastSecond} />
            {retention.drops.length > 0 && (
              <div className="grid gap-2">
                <p className="text-sm font-medium">Onde mais gente sai</p>
                <ol className="grid gap-1.5 text-sm">
                  {retention.drops.map((d) => (
                    <li key={d.from} className="flex items-baseline justify-between gap-3 rounded-md bg-muted/60 px-3 py-2">
                      <span>
                        Entre {formatDuration(d.from)} e {formatDuration(d.to)}
                      </span>
                      <span className="tabular-nums text-destructive">
                        −{d.lost.toLocaleString("pt-BR")} ({pct(d.share)})
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Chart({ retention, ctaAt, lastSecond }: { retention: Retention; ctaAt: number; lastSecond: number }) {
  const span = Math.max(lastSecond, 1);
  const x = (second: number) => (second / span) * W;
  const y = (share: number) => H - share * H;
  const line = retention.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.second).toFixed(1)},${y(p.share).toFixed(1)}`).join(" ");
  const area = `${line} L${x(lastSecond).toFixed(1)},${H} L0,${H} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * lastSecond));

  return (
    <figure className="grid gap-1">
      <div className="grid grid-cols-[2.5rem_1fr] gap-2">
        <div className="flex flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-44 w-full overflow-visible text-primary"
          role="img"
          aria-label="Curva de retenção do vídeo"
        >
          <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="stroke-border" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={W} y1={H} y2={H} className="stroke-border" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="currentColor" fillOpacity={0.12} />
          <path d={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          {ctaAt <= lastSecond && (
            <line x1={x(ctaAt)} x2={x(ctaAt)} y1={0} y2={H} className="stroke-amber-500" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      </div>
      <div className="ml-12 flex justify-between text-[10px] text-muted-foreground tabular-nums">
        {ticks.map((t, i) => (
          <span key={i}>{formatDuration(t)}</span>
        ))}
      </div>
      <figcaption className="ml-12 text-xs text-muted-foreground">
        % de quem deu play que ainda assistia. <span className="text-amber-600 dark:text-amber-400">Tracejado laranja</span>: momento em que o botão aparece.
      </figcaption>
    </figure>
  );
}
