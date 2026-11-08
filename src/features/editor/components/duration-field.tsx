"use client";

import { useState } from "react";
import { formatDuration, parseDuration } from "@/features/steps/vsl/duration";
import { control, Field } from "./fields";

type Props = { label: string; value: number; onChange: (seconds: number) => void; error?: string; hint?: string };

// Aceita "300", "300s", "2m30s" ou "2:30"; guarda sempre em segundos.
export function DurationField({ label, value, onChange, error, hint }: Props) {
  const [text, setText] = useState(() => formatDuration(value));
  const [invalid, setInvalid] = useState(false);

  return (
    <Field label={label} error={invalid ? "Use 300s, 2m30s ou 2:30" : error} hint={hint ?? `= ${value} segundos`}>
      <input
        className={control}
        value={text}
        inputMode="text"
        placeholder="2m30s"
        aria-invalid={invalid || Boolean(error)}
        onChange={(e) => {
          setText(e.target.value);
          const seconds = parseDuration(e.target.value);
          setInvalid(seconds === null);
          if (seconds !== null) onChange(seconds);
        }}
        onBlur={() => !invalid && setText(formatDuration(value))}
      />
    </Field>
  );
}
