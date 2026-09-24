import type { ReactNode } from "react";

import "./globals.css";
import type { Metadata } from "next";

import { AuthProvider } from "@/shared/auth/auth-context";
import { ThemeProvider } from "@/shared/theme/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "SmartRiego MX",
    template: "%s — SmartRiego MX",
  },
  description:
    "Plataforma de agricultura de precisión: riego y control de plagas por zona, en tiempo real.",
};

const themeInitScript = `(function(){try{var s=localStorage.getItem('smartriego-theme');var t=s==='light'||s==='dark'?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600;700&family=Geist+Mono:wght@500;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-ink antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}