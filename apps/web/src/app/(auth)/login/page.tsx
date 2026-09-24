import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { ThemeToggle } from "@/shared/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="relative hidden flex-none overflow-hidden bg-surface-inverse md:block md:w-[480px]">
        <svg
          viewBox="0 0 480 800"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <rect x="0" y="-40" width="200" height="420" rx="8" fill="var(--primary)" />
          <rect x="216" y="520" width="140" height="120" rx="8" fill="var(--suede-green)" />
          <rect x="216" y="360" width="80" height="48" rx="8" fill="var(--accent)" />
          <rect x="32" y="360" width="48" height="10" rx="5" fill="var(--ink-on-inverse)" fillOpacity="0.55" />
          <rect x="88" y="360" width="72" height="10" rx="5" fill="var(--ink-on-inverse)" fillOpacity="0.55" />
          <rect x="32" y="384" width="96" height="10" rx="5" fill="var(--ink-on-inverse)" fillOpacity="0.55" />
          <rect x="32" y="408" width="64" height="10" rx="5" fill="var(--ink-on-inverse)" fillOpacity="0.55" />
          <rect x="104" y="408" width="40" height="10" rx="5" fill="var(--ink-on-inverse)" fillOpacity="0.55" />
        </svg>

        <div className="absolute bottom-16 left-10 right-10 text-ink-on-inverse">
          <div className="font-display text-[32px] font-bold leading-[1.05] tracking-[-0.01em]">
            SmartRiego
            <br />
            MX
          </div>
          <div className="mt-3 max-w-[320px] text-[15px] leading-[22px] opacity-75">
            Riego y control de plagas por zona, en tiempo real.
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center p-10">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="flex w-[380px] flex-col gap-7">
          <div className="md:hidden">
            <div className="font-display text-2xl font-bold text-ink">
              SmartRiego MX
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Riego y control de plagas por zona.
            </p>
          </div>

          <div>
            <h1 className="m-0 font-display text-[26px] font-bold text-ink">
              Bienvenido de vuelta
            </h1>
            <p className="mt-1.5 text-[15px] leading-[22px] text-ink-muted">
              Entra para ver el estado de tus parcelas.
            </p>
          </div>

          <LoginForm />

          <div className="border-t border-border pt-[18px] text-center text-[13px] text-ink-muted">
            SmartRiego MX · plataforma de agricultura de precisión
          </div>
        </div>
      </main>
    </div>
  );
}