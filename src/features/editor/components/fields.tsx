"use client";

import type { ReactNode } from "react";

export const control =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

type TextProps = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
};

export function TextField({ label, value, onChange, error, hint, multiline, maxLength = 500, placeholder }: TextProps) {
  const props = {
    value: value ?? "",
    maxLength,
    placeholder,
    "aria-invalid": Boolean(error),
    className: control,
  };
  return (
    <Field label={label} error={error} hint={hint}>
      {multiline ? (
        <textarea {...props} rows={4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...props} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

type NumberProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
};

export function NumberField({ label, value, onChange, error, hint, min, max, step }: NumberProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        type="number"
        className={control}
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </Field>
  );
}

type SelectProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SelectField<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <Field label={label}>
      <select className={control} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="size-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function ColorField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} error={error}>
      <span className="flex gap-2">
        <input
          type="color"
          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <input className={control} value={value} maxLength={7} aria-invalid={Boolean(error)} onChange={(e) => onChange(e.target.value)} />
      </span>
    </Field>
  );
}

// Cor opcional: sem valor, a página usa o padrão (do tema ou contraste automático).
export function OptionalColorField({ label, value, fallback, onChange }: { label: string; value?: string; fallback: string; onChange: (v: string | undefined) => void }) {
  if (value === undefined) {
    return (
      <Field label={label}>
        <button type="button" className="h-8 rounded border border-dashed border-input px-2 text-left text-xs text-muted-foreground hover:bg-muted" onClick={() => onChange("#FFFFFF")}>
          Padrão ({fallback}) · personalizar
        </button>
      </Field>
    );
  }
  return (
    <div className="grid gap-1">
      <ColorField label={label} value={value} onChange={onChange} />
      <button type="button" className="justify-self-start text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange(undefined)}>
        Voltar ao padrão
      </button>
    </div>
  );
}

// Lista de itens com adicionar/remover/reordenar; cada item renderiza o próprio formulário.
export function ItemList<T>({
  items,
  onChange,
  render,
  create,
  min = 0,
  max = Infinity,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (item: T) => void, index: number) => ReactNode;
  create: () => T;
  min?: number;
  max?: number;
  addLabel: string;
}) {
  const update = (index: number, item: T) => onChange(items.map((current, i) => (i === index ? item : current)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const button = "rounded px-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30";

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div key={index} className="grid gap-2 rounded-lg border bg-background p-3">
          <div className="flex justify-end gap-1">
            <button type="button" className={button} disabled={index === 0} onClick={() => move(index, -1)} aria-label="Subir">↑</button>
            <button type="button" className={button} disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Descer">↓</button>
            <button
              type="button"
              className={button}
              disabled={items.length <= min}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remover
            </button>
          </div>
          {render(item, (next) => update(index, next), index)}
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="rounded-lg border border-dashed py-2 text-sm hover:bg-muted" onClick={() => onChange([...items, create()])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}
