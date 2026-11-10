"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import type { Step } from "@/features/steps/schema";
import { ADDABLE_STEP_TYPES, OFFER_STEP_TYPES, STEP_TYPE_LABELS, type AddableStepType } from "../document-ops";

type Props = {
  steps: Step[];
  selectedId: string | null;
  invalidIds: Set<string>;
  hasOffers: boolean;
  onSelect: (id: string) => void;
  onMove: (fromId: string, toId: string) => void;
  onAdd: (type: AddableStepType) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleHidden: (id: string) => void;
};

function StepRow({ step, index, selected, invalid, canRemove, ...actions }: {
  step: Step;
  index: number;
  selected: boolean;
  invalid: boolean;
  canRemove: boolean;
} & Pick<Props, "onSelect" | "onDuplicate" | "onRemove" | "onToggleHidden">) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const icon = "rounded p-1.5 lg:p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-1 rounded-lg border bg-background px-1.5 py-1.5 text-sm ${
        selected ? "border-primary ring-1 ring-primary" : ""
      } ${isDragging ? "z-10 shadow-lg" : ""} ${step.hidden ? "opacity-50" : ""}`}
    >
      <button type="button" className="cursor-grab touch-none p-1 text-muted-foreground" aria-label="Arrastar" {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => actions.onSelect(step.id)}>
        <span className="block truncate font-medium">
          {index + 1}. {step.name}
          {invalid && <span className="ml-1 text-destructive" title="Campos com erro">●</span>}
        </span>
        <span className="block text-xs text-muted-foreground">{STEP_TYPE_LABELS[step.type]}</span>
      </button>
      <span className="flex [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
        <button type="button" className={icon} onClick={() => actions.onToggleHidden(step.id)} aria-label={step.hidden ? "Mostrar" : "Ocultar"}>
          {step.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
        <button type="button" className={icon} onClick={() => actions.onDuplicate(step.id)} aria-label="Duplicar">
          <Copy className="size-3.5" />
        </button>
        <button type="button" className={icon} disabled={!canRemove} onClick={() => actions.onRemove(step.id)} aria-label="Excluir">
          <Trash2 className="size-3.5" />
        </button>
      </span>
    </li>
  );
}

export function StepList({ steps, selectedId, invalidIds, hasOffers, onSelect, onMove, onAdd, ...actions }: Props) {
  const [adding, setAdding] = useState(false);
  const dndId = useId(); // id estável evita divergência de hidratação no aria-describedby

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <div className="grid gap-3">
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="grid gap-1.5">
            {steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                selected={step.id === selectedId}
                invalid={invalidIds.has(step.id)}
                canRemove={steps.length > 1}
                onSelect={onSelect}
                {...actions}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {adding ? (
        <div className="grid grid-cols-2 gap-1.5">
          {ADDABLE_STEP_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              disabled={OFFER_STEP_TYPES.has(type) && !hasOffers}
              title={OFFER_STEP_TYPES.has(type) && !hasOffers ? "Crie uma oferta primeiro" : undefined}
              className="rounded-md border bg-background px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-40"
              onClick={() => {
                onAdd(type);
                setAdding(false);
              }}
            >
              {STEP_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="rounded-lg border border-dashed py-2 text-sm hover:bg-muted" onClick={() => setAdding(true)}>
          + Adicionar step
        </button>
      )}
    </div>
  );
}
