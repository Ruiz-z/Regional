import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type { DashboardData } from "@/features/dashboard/types";
import { DASHBOARD_MOCK } from "@/features/dashboard/lib/mock-data";

const DASHBOARD_PATH = "/dashboard";

export function isMocksEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_MOCK === "true";
}

export async function getDashboard(token?: string): Promise<DashboardData> {
  if (isMocksEnabled()) {
    return DASHBOARD_MOCK;
  }

  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }

  try {
    return await apiFetch<DashboardData>(DASHBOARD_PATH, {}, authToken);
  } catch (error) {
    console.warn(
      "Dashboard real no disponible (endpoints BE-023/BE-024 pendientes), usando datos de demostración.",
      error,
    );
    return DASHBOARD_MOCK;
  }
}