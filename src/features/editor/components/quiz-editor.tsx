"use client";

import { Paintbrush, Settings } from "lucide-react";
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
import { StepForm } from "../forms/step-form";
import { ThemeForm } from "../forms/theme-form";
import { useAutosave } from "../use-autosave";
import { Preview } from "./preview";
import { PublishButton } from "./publish-button";
import { StepList } from "./step-list";

type Props = {
  quiz: { id: string; name: string; status: string; draftDocument: QuizDocument; draftRevision: number };
  liveUrl: string | null;
  cloudName?: string;
};

const STATUS_TEXT = { pending: "Alterações pendentes…", saving: "Salvando…", saved: "Salvo", error: "Erro ao salvar" } as const;

export function QuizEditor({ quiz, liveUrl, cloudName }: Props) {
  const [doc, setDoc] = useState(quiz.draftDocument);
  const [selectedId, setSelectedId] = useState<string | null>(doc.steps[0]?.id ?? null);
  const [panel, setPanel] = useState<"step" | "theme">("step");
  const [resetKey, setResetKey] = useState(0);
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
  const select = (id: string) => {
    setSelectedId(id);
    setPanel("step");
    setResetKey((k) => k + 1);
  };

  const statusText = !valid ? "Corrija os campos para salvar" : autosave.status === "error" ? autosave.error : STATUS_TEXT[autosave.status];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
        <h1 className="truncate font-semibold">{quiz.name}</h1>
        <Badge variant={quiz.status === "published" ? "default" : "secondary"}>{quiz.status === "published" ? "Publicado" : "Rascunho"}</Badge>
        <span className={`text-xs ${!valid || autosave.status === "error" ? "text-destructive" : "text-muted-foreground"}`} role="status">
          {statusText}
        </span>
        <span className="flex-1" />
        {liveUrl && (
          <a href={liveUrl} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
            Ver no ar ↗
          </a>
        )}
        <Link href={`/quizzes/${quiz.id}/settings`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Settings className="size-4" /> Configurações
        </Link>
        <PublishButton quizId={quiz.id} document={doc} draftValid={valid} flush={autosave.flush} revision={autosave.revision} onSelectStep={select} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_380px]">
        <aside className="grid content-start gap-3 overflow-y-auto border-r bg-muted/30 p-3">
          <button
            type="button"
            onClick={() => setPanel("theme")}
            className={`flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm ${panel === "theme" ? "border-primary ring-1 ring-primary" : ""}`}
          >
            <Paintbrush className="size-4" /> Tema e navegação
            {issues._doc && <span className="text-destructive">●</span>}
          </button>
          <StepList
            steps={doc.steps}
            selectedId={panel === "step" ? selectedId : null}
            invalidIds={invalidIds}
            onSelect={select}
            onMove={(from, to) => update(moveStep(doc, from, to))}
            onAdd={(type: AddableStepType) => {
              const result = addStep(doc, type, selectedId ?? undefined);
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

        <section className="overflow-y-auto bg-muted/50 p-6">
          <Preview document={doc} selectedId={selectedId} cloudName={cloudName} resetKey={resetKey} />
        </section>

        <aside className="overflow-y-auto border-l bg-background p-4">
          {panel === "theme" ? (
            <ThemeForm
              theme={doc.theme}
              settings={doc.settings}
              issues={issues._doc}
              cloudName={cloudName}
              onTheme={(theme) => update(updateTheme(doc, theme))}
              onSettings={(settings) => update(updateSettings(doc, settings))}
            />
          ) : selected ? (
            <StepForm step={selected} issues={issues[selected.id]} cloudName={cloudName} onChange={(step: Step) => update(replaceStep(doc, step))} />
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um step.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
