import type { Metadata } from "next";
import Link from "next/link";
import { requireStudioUser } from "@/features/auth/require-studio-user";

// Studio é privado e sempre lê o JWT do request: renderiza bloqueando, sem static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Anzol Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const { email } = await requireStudioUser();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight">Anzol Studio</Link>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
