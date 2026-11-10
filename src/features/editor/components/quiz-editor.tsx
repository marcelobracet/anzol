"use client";

import { BarChart3, Eye, History, ListOrdered, Paintbrush, Pencil, Settings, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { QuizDocument } from "@/features/quiz/document/schema";
import type { Step } from "@/features/steps/schema";
import {
  addStep,
  duplicateStep,
  issuesByStep,
  moveStep,
  removeStep,
  replaceStep,
  toggleHidden,
  updateSettings,
  updateTheme,
  type AddableStepType,
} from "../document-ops";
import { OffersForm } from "../forms/offers-form";
import { StepForm } from "../forms/step-form";
import { ThemeForm } from "../forms/theme-form";
import { addOffer, offerInUse, removeOffer, updateOffer } from "../offer-ops";
import { useAutosave } from "../use-autosave";
import { Preview } from "./preview";
import { PublishButton } from "./publish-button";
import { StepList } from "./step-list";

type Props = {
  quiz: { id: string; name: string; locale: string; status: string; draftDocument: QuizDocument; draftRevision: number };
  liveUrl: string | null;
  cloudName?: string;
  bunnyHost?: string;
};

type MobilePane = "steps" | "edit" | "preview";
const MOBILE_TABS: { value: MobilePane; label: string; Icon: typeof Eye }[] = [
  { value: "steps", label: "Steps", Icon: ListOrdered },
  { value: "edit", label: "Editar", Icon: Pencil },
  { value: "preview", label: "Prévia", Icon: Eye },
];
const navLink = "flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground";
const sideButton = (active: boolean) =>
  `flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm hover:bg-muted ${active ? "border-primary ring-1 ring-primary" : ""}`;

const STATUS_TEXT = { pending: "Alterações pendentes…", saving: "Salvando…", saved: "Salvo", error: "Erro ao salvar" } as const;

export function QuizEditor({ quiz, liveUrl, cloudName, bunnyHost }: Props) {
  const [doc, setDoc] = useState(quiz.draftDocument);
  const [selectedId, setSelectedId] = useState<string | null>(doc.steps[0]?.id ?? null);
  const [panel, setPanel] = useState<"step" | "theme" | "offers">("step");
  const [resetKey, setResetKey] = useState(0);
  // Abaixo de lg só um painel aparece por vez; no desktop os três ficam lado a lado.
  const [pane, setPane] = useState<MobilePane>("steps");
  const showPane = (target: MobilePane) => (pane === target ? "flex" : "hidden lg:flex");
  const autosave = useAutosave(quiz.id, quiz.draftRevision);

  const issues = useMemo(() => issuesByStep(doc), [doc]);
  const valid = Object.keys(issues).length === 0;
  const invalidIds = useMemo(() => new Set(Object.keys(issues)), [issues]);
  const selected = doc.steps.find((s) => s.id === selectedId) ?? null;

  // Rascunho só é salvo quando válido: o banco nunca guarda documento quebrado.
  const update = (next: QuizDocument) => {
    setDoc(next);
    if (Object.keys(issuesByStep(next)).length === 0) autosave.schedule(next);
  };
  const openPanel = (next: "theme" | "offers") => {
    setPanel(next);
    setPane("edit");
  };
  const select = (id: string) => {
    setSelectedId(id);
    setPanel("step");
    setPane("edit");
    setResetKey((k) => k + 1);
  };

  const statusText = !valid ? "Corrija os campos para salvar" : autosave.status === "error" ? autosave.error : STATUS_TEXT[autosave.status];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b bg-background px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate font-semibold">{quiz.name}</h1>
          <Badge variant={quiz.status === "published" ? "default" : "secondary"} className="shrink-0">
            {quiz.status === "published" ? "Publicado" : "Rascunho"}
          </Badge>
          <span className={`hidden truncate text-xs sm:inline ${!valid || autosave.status === "error" ? "text-destructive" : "text-muted-foreground"}`} role="status">
            {statusText}
          </span>
        </div>
        <div className="shrink-0 md:order-last">
          <PublishButton quizId={quiz.id} document={doc} draftValid={valid} flush={autosave.flush} revision={autosave.revision} onSelectStep={select} />
        </div>
        <nav className="-mx-1 flex w-full items-center gap-0.5 overflow-x-auto md:mx-0 md:w-auto" aria-label="Ações do quiz">
          <span className={`mr-auto truncate px-1 text-xs sm:hidden ${!valid || autosave.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {statusText}
          </span>
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noreferrer" className={navLink}>
              Ver no ar ↗
            </a>
          )}
          <Link href={`/quizzes/${quiz.id}/versions`} className={navLink} title="Versões">
            <History className="size-4" /> <span className="hidden sm:inline">Versões</span>
          </Link>
          <Link href={`/quizzes/${quiz.id}/funnel`} className={navLink} title="Funil e retenção">
            <BarChart3 className="size-4" /> <span className="hidden sm:inline">Funil</span>
          </Link>
          <Link href={`/quizzes/${quiz.id}/settings`} className={navLink} title="Configurações">
            <Settings className="size-4" /> <span className="hidden sm:inline">Configurações</span>
          </Link>
        </nav>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(340px,400px)]">
        <aside className={`${showPane("steps")} min-h-0 min-w-0 flex-col gap-3 overflow-y-auto bg-muted/30 p-3 lg:border-r`}>
          <button type="button" onClick={() => openPanel("theme")} className={sideButton(panel === "theme")}>
            <Paintbrush className="size-4 shrink-0" /> <span className="truncate">Tema, navegação e Pixel</span>
            {issues._doc?.some((i) => i.path[0] !== "offers") && <span className="text-destructive">●</span>}
          </button>
          <button type="button" onClick={() => openPanel("offers")} className={sideButton(panel === "offers")}>
            <ShoppingCart className="size-4 shrink-0" /> <span className="truncate">Ofertas ({doc.offers.length})</span>
            {issues._doc?.some((i) => i.path[0] === "offers") && <span className="text-destructive">●</span>}
          </button>
          <StepList
            steps={doc.steps}
            selectedId={panel === "step" ? selectedId : null}
            invalidIds={invalidIds}
            hasOffers={doc.offers.length > 0}
            onSelect={select}
            onMove={(from, to) => update(moveStep(doc, from, to))}
            onAdd={(type: AddableStepType) => {
              const result = addStep(doc, type, selectedId ?? undefined);
              if (!result) return openPanel("offers");
              update(result.doc);
              select(result.id);
            }}
            onDuplicate={(id) => {
              const result = duplicateStep(doc, id);
              update(result.doc);
              select(result.id);
            }}
            onRemove={(id) => {
              const next = removeStep(doc, id);
              update(next);
              if (id === selectedId) select(next.steps[0].id);
            }}
            onToggleHidden={(id) => update(toggleHidden(doc, id))}
          />
        </aside>

        <section className={`${showPane("preview")} min-h-0 min-w-0 justify-center overflow-y-auto bg-muted/50 p-3 sm:p-6`}>
          <Preview document={doc} selectedId={selectedId} cloudName={cloudName} bunnyHost={bunnyHost} locale={quiz.locale} resetKey={resetKey} />
        </section>

        <aside className={`${showPane("edit")} min-h-0 min-w-0 flex-col overflow-y-auto bg-background p-4 lg:border-l`}>
          {panel === "offers" ? (
            <OffersForm
              offers={doc.offers}
              issues={issues._doc}
              inUse={(id) => offerInUse(doc, id)}
              onAdd={() => update(addOffer(doc).doc)}
              onChange={(offer) => update(updateOffer(doc, offer))}
              onRemove={(id) => update(removeOffer(doc, id))}
            />
          ) : panel === "theme" ? (
            <ThemeForm
              theme={doc.theme}
              settings={doc.settings}
              issues={issues._doc}
              cloudName={cloudName}
              onTheme={(theme) => update(updateTheme(doc, theme))}
              onSettings={(settings) => update(updateSettings(doc, settings))}
              tracking={doc.tracking}
              onTracking={(tracking) => update({ ...doc, tracking })}
            />
          ) : selected ? (
            <StepForm step={selected} issues={issues[selected.id]} cloudName={cloudName} offers={doc.offers} quizId={quiz.id} onChange={(step: Step) => update(replaceStep(doc, step))} />
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um step.</p>
          )}
        </aside>
      </div>

      <nav className="grid shrink-0 grid-cols-3 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Painéis do editor">
        {MOBILE_TABS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={pane === value}
            onClick={() => setPane(value)}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${pane === value ? "text-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
