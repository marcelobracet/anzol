"use client";

import type { LoadingStep } from "@/features/steps/loading/schema";
import { ItemList, NumberField, TextField } from "../components/fields";
import { errorAt } from "../document-ops";
import type { StepFormProps } from "./form-props";

type Message = LoadingStep["messages"][number];

export function LoadingForm({ step, onChange, issues }: StepFormProps<LoadingStep>) {
  const set = (patch: Partial<LoadingStep>) => onChange({ ...step, ...patch });
  return (
    <div className="grid gap-4">
      <TextField label="Título" value={step.title} onChange={(title) => set({ title })} error={errorAt(issues, "title")} />
      <h3 className="text-sm font-semibold">Mensagens</h3>
      <ItemList<Message>
        items={step.messages}
        onChange={(messages) => set({ messages })}
        min={1}
        max={10}
        addLabel="Mensagem"
        create={() => ({ text: "Nova mensagem", durationMs: 1500 })}
        render={(message, update, i) => (
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <TextField label="Texto" value={message.text} onChange={(text) => update({ ...message, text })} error={errorAt(issues, "messages", i, "text")} />
            <NumberField
              label="Duração (ms)"
              min={300}
              max={10000}
              step={100}
              value={message.durationMs}
              onChange={(durationMs) => update({ ...message, durationMs: durationMs ?? 300 })}
              error={errorAt(issues, "messages", i, "durationMs")}
            />
          </div>
        )}
      />
    </div>
  );
}
