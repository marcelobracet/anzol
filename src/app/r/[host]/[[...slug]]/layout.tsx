import type { Viewport } from "next";
import { fontClassName } from "@/features/runtime/fonts";
import { themeStyle } from "@/features/runtime/theme";
import { quizFromParams } from "./load";
import "../../../globals.css";

// Snapshot vem do cache ('use cache' + tag); a página só bloqueia na primeira visita.
export const instant = false;

// Root params exigem ao menos um valor no build. "_shell" é host inválido: vira 404 sem tocar no banco;
// os domínios reais são renderizados sob demanda e ficam no cache.
export function generateStaticParams() {
  return [{ host: "_shell", slug: [] }];
}

export async function generateViewport({ params }: LayoutProps<"/r/[host]/[[...slug]]">): Promise<Viewport> {
  const quiz = await quizFromParams(params);
  return { themeColor: quiz.document.theme.colors.background };
}

// Root layout do runtime: idioma, fonte e tema vêm do quiz publicado.
export default async function RuntimeLayout({ children, params }: LayoutProps<"/r/[host]/[[...slug]]">) {
  const quiz = await quizFromParams(params);
  const { theme } = quiz.document;

  return (
    <html lang={quiz.locale} className={`${fontClassName(theme.font)} antialiased`}>
      <body style={themeStyle(theme)} className="min-h-dvh bg-[var(--q-bg)] text-[var(--q-text)]">
        {children}
      </body>
    </html>
  );
}
