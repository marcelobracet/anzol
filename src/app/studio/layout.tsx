import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { parseThemePref, THEME_COOKIE } from "@/features/studio-theme/theme-pref";
import { ThemeToggle } from "@/features/studio-theme/theme-toggle";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Studio é privado e sempre lê o JWT do request: renderiza bloqueando, sem static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Anzol Studio",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// "Sistema" depende do aparelho: resolve antes da pintura para não piscar.
const SYSTEM_THEME_SCRIPT = `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

// Root layout do Studio. O runtime tem o próprio (lang e tema vêm do quiz).
export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const { email } = await requireStudioUser();
  const theme = parseThemePref((await cookies()).get(THEME_COOKIE)?.value);
  const themeClass = theme === "dark" ? "dark" : "";

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${themeClass} h-full antialiased`}
      style={theme === "system" ? undefined : { colorScheme: theme }}
    >
      <head>{theme === "system" && <script dangerouslySetInnerHTML={{ __html: SYSTEM_THEME_SCRIPT }} />}</head>
      <body className={`${geistSans.className} min-h-full`}>
        <div className="min-h-dvh bg-muted/30">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-4">
              <nav className="flex min-w-0 items-center gap-4 sm:gap-5">
                <Link href="/" className="shrink-0 font-semibold tracking-tight">Anzol Studio</Link>
                <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">Templates</Link>
              </nav>
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden truncate text-sm text-muted-foreground md:inline">{email}</span>
                <ThemeToggle initial={theme} />
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
