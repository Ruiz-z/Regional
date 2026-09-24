"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/shared/auth/auth-context";
import { cn } from "@/shared/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

const BASE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/parcels", label: "Mis parcelas" },
  { href: "/parcels/manage", label: "Gestionar parcelas y zonas" },
  { href: "/reports", label: "Histórico y reportes" },
  { href: "/profile", label: "Perfil" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/devices", label: "Dispositivos" },
  { href: "/admin/config", label: "Configuración" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(email: string | undefined): string {
  if (!email) {
    return "?";
  }
  const local = email.split("@")[0] ?? "?";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] ?? "?").toUpperCase() +
      (parts[1][0] ?? "?").toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isAuthenticated, session, clearToken } = useAuth();

  React.useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-semibold text-ink-muted">
          Cargando…
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return null;
  }

  const isAdmin = session.role === "ADMIN";
  const nav = isAdmin ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;
  const roleLabel = isAdmin ? "Administrador" : "Mi operación";

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="flex w-60 flex-none flex-col gap-7 bg-surface-inverse px-4 pb-6 pt-6 text-ink-on-inverse">
        <div className="px-2 font-display text-[19px] font-bold tracking-[-0.01em]">
          SmartRiego MX
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold text-ink-on-inverse no-underline opacity-70 transition-opacity hover:opacity-100",
                isActive(pathname, item.href) &&
                  "bg-white/10 opacity-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2.5 border-t border-white/15 pt-4">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-[13px] font-bold text-on-primary">
              {initialsOf(session.email)}
            </div>
            <div>
              <div className="text-[13px] font-bold">
                {session.email ?? "Usuario"}
              </div>
              <div className="text-xs opacity-65">{roleLabel}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="justify-start px-3 text-[13px] font-semibold text-ink-on-inverse opacity-80 hover:bg-white/10 hover:text-ink-on-inverse"
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}