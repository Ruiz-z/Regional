import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import { isMocksEnabled } from "@/features/dashboard/lib/api";
import type { ParcelDetail } from "@/features/parcels/types";
import { PARCELS_MOCK } from "@/features/parcels/lib/mock-data";

const PARCEL_TREATMENT_COOLDOWN_MS = 10 * 60 * 1000;

export interface TreatmentResult {
  activatedAt: string;
  cooldownUntil: string;
}

export async function getParcelDetail(
  parcelId: string,
  token?: string,
): Promise<ParcelDetail> {
  if (isMocksEnabled()) {
    const parcel = PARCELS_MOCK[parcelId];
    if (!parcel) {
      throw new Error("Parcela no encontrada.");
    }
    return {
      ...parcel,
      zones: parcel.zones.map((zone) => ({
        ...zone,
        id: zone.cell.id,
      })),
    };
  }

  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }
  return apiFetch<ParcelDetail>(`/parcels/${parcelId}`, {}, authToken);
}

export async function activateZoneTreatment(
  zoneId: string,
  token?: string,
): Promise<TreatmentResult> {
  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }

  if (isMocksEnabled()) {
    const now = Date.now();
    return {
      activatedAt: new Date(now).toISOString(),
      cooldownUntil: new Date(now + PARCEL_TREATMENT_COOLDOWN_MS).toISOString(),
    };
  }

  return apiFetch<TreatmentResult>(
    `/zones/${encodeURIComponent(zoneId)}/treat`,
    { method: "POST" },
    authToken,
  );
}

export function isZoneInCooldown(cooldownUntil: string | null): boolean {
  if (!cooldownUntil) {
    return false;
  }
  return Date.parse(cooldownUntil) > Date.now();
}