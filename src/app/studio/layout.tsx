import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Studio é privado e sempre lê o JWT do request: renderiza bloqueando, sem static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Anzol Studio",
  robots: { index: false, follow: false },
};

// Root layout do Studio. O runtime tem o próprio (lang e tema vêm do quiz).
export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const { email } = await requireStudioUser();

  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className={`${geistSans.className} min-h-full`}>
        <div className="min-h-screen bg-muted/30">
          <header className="border-b bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <nav className="flex items-center gap-5">
                <Link href="/" className="font-semibold tracking-tight">Anzol Studio</Link>
                <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">Templates</Link>
              </nav>
              <span className="text-sm text-muted-foreground">{email}</span>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
