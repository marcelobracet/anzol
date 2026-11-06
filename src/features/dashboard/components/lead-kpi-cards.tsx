import { CircleCheckBig, Contact, Eye, MousePointerClick, Percent, Star } from "lucide-react";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeadKpis } from "../leads";

type Item = { label: string; value: string; hint: string; icon: ComponentType<{ className?: string }> };

const number = (n: number) => n.toLocaleString("pt-BR");

export function LeadKpiCards({ kpis, qualifiedMin }: { kpis: LeadKpis; qualifiedMin: number }) {
  const items: Item[] = [
    { label: "Visitantes", value: number(kpis.visitors), hint: "Sessões que abriram o quiz", icon: Eye },
    { label: "Interagiram", value: number(kpis.interacted), hint: "Passaram da primeira etapa", icon: MousePointerClick },
    { label: "Taxa de interação", value: kpis.interactionRate.toLocaleString("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }), hint: "Interagiram ÷ visitantes", icon: Percent },
    { label: "Qualificados", value: number(kpis.qualified), hint: `Viram ${qualifiedMin}+ etapas (metade do quiz)`, icon: Star },
    { label: "Fluxos completos", value: number(kpis.completed), hint: "Chegaram à última etapa", icon: CircleCheckBig },
    { label: "Contatos", value: number(kpis.contacts), hint: "Enviaram o formulário de lead", icon: Contact },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label} size="sm">
          <CardContent className="grid gap-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
            <p className="flex items-center gap-2 text-2xl font-semibold tabular-nums">
              <Icon className="size-4 text-muted-foreground" />
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
