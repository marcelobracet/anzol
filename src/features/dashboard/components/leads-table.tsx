import type { Step } from "@/features/steps/schema";
import type { StepRate, StepTone } from "../funnel";
import { cellsFor, type SessionRow } from "../leads";

const STEP_KIND: Record<Step["type"], string> = {
  question: "pergunta",
  info: "info",
  loading: "carregando",
  result: "resultado",
  vsl: "vsl",
  offerTimer: "oferta",
  leadForm: "formulário",
  socialProof: "prova social",
};

const TONE_BAR: Record<StepTone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-400",
  bad: "bg-red-500",
  none: "bg-muted-foreground/30",
};

const percent = (rate: number) => rate.toLocaleString("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

function rateTitle(rate: StepRate | undefined): string {
  if (!rate) return "";
  if (rate.rate === null) return `${rate.sessions.toLocaleString("pt-BR")} sessões (primeira etapa)`;
  return `Taxa de interação: ${percent(rate.rate)} da etapa anterior · ${rate.sessions.toLocaleString("pt-BR")} sessões nesta etapa`;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

const origin = (utm: Partial<Record<string, string>>) => [utm.utm_source, utm.utm_campaign].filter(Boolean).join(" / ");

export function LeadsTable({ steps, rows, rates }: { steps: Step[]; rows: SessionRow[]; rates: StepRate[] }) {
  const rateOf = new Map(rates.map((r) => [r.stepId, r]));
  const sticky = "sticky left-0 z-10 bg-background";
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-max min-w-full border-collapse text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="sticky left-0 z-10 border-b bg-muted px-3 py-2 font-medium">Entrada</th>
            <th className="border-b px-3 py-2 font-medium">Origem</th>
            {steps.map((step, i) => {
              const rate = rateOf.get(step.id);
              return (
                <th key={step.id} title={rateTitle(rate)} className="relative max-w-56 border-b border-l py-2 pr-3 pl-4 font-medium">
                  <span aria-hidden className={`absolute inset-y-1 left-1 w-1.5 rounded-sm ${TONE_BAR[rate?.tone ?? "none"]}`} />
                  <span className="block">Etapa {i + 1} · {step.name}</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    {STEP_KIND[step.type]}
                    {rate?.rate != null && <> · <span className="tabular-nums">{percent(rate.rate)}</span> da anterior</>}
                  </span>
                </th>
              );
            })}
            <th className="border-b border-l px-3 py-2 font-medium">Checkout</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sessionId} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className={`${sticky} px-3 py-2 whitespace-nowrap tabular-nums`}>{when(row.startedAt)}</td>
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{origin(row.utm) || "—"}</td>
              {cellsFor(steps, row).map((cell, i) => (
                <td
                  key={steps[i].id}
                  title={cell}
                  className={`max-w-56 truncate border-l px-3 py-2 ${cell === "visto" ? "text-muted-foreground" : ""}`}
                >
                  {cell}
                </td>
              ))}
              <td className="border-l px-3 py-2 text-center">{row.checkout ? "✓" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
