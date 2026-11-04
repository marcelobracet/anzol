import type { ButtonHTMLAttributes } from "react";

export function QuizButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`min-h-12 w-full rounded-[var(--q-radius)] bg-[var(--q-primary)] px-6 text-base font-semibold text-[var(--q-on-primary)] transition active:scale-[0.98] disabled:opacity-40 ${className}`}
    />
  );
}

// CTA preso ao rodapé no mobile, onde o polegar alcança.
export function StickyCta(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto bg-gradient-to-t from-[var(--q-bg)] via-[var(--q-bg)] to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <QuizButton {...props} />
    </div>
  );
}
