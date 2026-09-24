import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type { ParcelHistoryReport } from "@/features/reports/types";
import { historyMock } from "@/features/reports/lib/mock-data";
import { isMocksEnabled } from "@/features/dashboard/lib/api";

function historyPath(parcelId: string, from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) {
    params.set("from", from);
  }
  if (to) {
    params.set("to", to);
  }
  const query = params.toString();
  return `/parcels/${parcelId}/history${query ? `?${query}` : ""}`;
}

export async function getParcelHistory(
  parcelId: string,
  from?: string,
  to?: string,
  token?: string,
): Promise<ParcelHistoryReport> {
  if (isMocksEnabled() || parcelId === "all") {
    return historyMock(parcelId);
  }

  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }

  try {
    return await apiFetch<ParcelHistoryReport>(
      historyPath(parcelId, from, to),
      {},
      authToken,
    );
  } catch (error) {
    console.warn(
      "Histórico real no disponible (endpoint BE-035 pendiente), usando datos de demostración.",
      error,
    );
    return historyMock(parcelId);
  }
}