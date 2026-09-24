import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import { isMocksEnabled } from "@/features/dashboard/lib/api";
import type { ZoneSnapshot, ZoneTone } from "@/features/zones/components/zone-cell";
import type {
  ParcelDetail,
  ZoneDetail,
  ZoneHistoryEvent,
  ZonePestState,
} from "@/features/parcels/types";
import { PARCELS_MOCK } from "@/features/parcels/lib/mock-data";

const PARCEL_TREATMENT_COOLDOWN_MS = 10 * 60 * 1000;
const RECENT_DAYS = 7;

export interface TreatmentResult {
  activatedAt: string;
  cooldownUntil: string;
}

// --- Formas reales de la API ---

interface ApiZone {
  id: string;
  name: string;
  humidityThreshold: number;
  latestReading: {
    humidity: number;
    temperature: number;
    createdAt: string;
  } | null;
  pestLevel: ZonePestState;
  cooldownUntil: string | null;
}

interface ApiParcel {
  id: string;
  name: string;
  crop: string;
  location: string;
  ownerId: string;
  zones: ApiZone[];
}

interface ApiIrrigationEvent {
  id: string;
  durationMinutes: number | null;
  correctedForRain: boolean;
  createdAt: string;
}

interface ApiHistoryZone {
  zoneId: string;
  irrigationEvents: ApiIrrigationEvent[];
}

interface ApiHistory {
  zones: ApiHistoryZone[];
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

function zoneToneAndLabel(zone: ApiZone): { tone: ZoneTone; statusLabel: string } {
  if (zone.pestLevel === "INTERVENCION") {
    return { tone: "danger", statusLabel: "Intervención" };
  }
  if (zone.pestLevel === "MONITOREO") {
    return { tone: "warn", statusLabel: "Monitoreo" };
  }
  if (!zone.latestReading) {
    return { tone: "off", statusLabel: "Sin lectura" };
  }
  if (zone.latestReading.humidity < zone.humidityThreshold) {
    return { tone: "water", statusLabel: "Regando" };
  }
  return { tone: "ok", statusLabel: "Normal" };
}

function pestLabel(level: ZonePestState): { tone: ZoneTone; label: string } {
  if (level === "INTERVENCION") return { tone: "danger", label: "Intervención" };
  if (level === "MONITOREO") return { tone: "warn", label: "Monitoreo" };
  return { tone: "ok", label: "Normal" };
}

function toZoneDetail(
  zone: ApiZone,
  history: ApiHistoryZone | undefined,
): ZoneDetail {
  const { tone, statusLabel } = zoneToneAndLabel(zone);
  const cell: ZoneSnapshot = {
    id: zone.id,
    name: zone.name,
    humidityPct: zone.latestReading?.humidity ?? null,
    statusLabel,
    tone,
  };
  const pest = pestLabel(zone.pestLevel);
  const historyEvents: ZoneHistoryEvent[] = (history?.irrigationEvents ?? [])
    .slice()
    .reverse()
    .map((event) => ({
      id: event.id,
      time: timeAgo(event.createdAt),
      tone: event.correctedForRain ? "info" : "water",
      title: event.correctedForRain
        ? "Corrección por lluvia insuficiente"
        : "Riego ejecutado",
      detail: `${event.durationMinutes ?? 0} min`,
    }));

  return {
    id: zone.id,
    cell,
    size: "—",
    targetPct: zone.humidityThreshold,
    temperatureC: zone.latestReading?.temperature ?? null,
    irrigation: tone === "water" ? { tone: "water", label: "Regando" } : { tone: "ok", label: "Normal" },
    pest,
    pestState: zone.pestLevel,
    cooldownUntil: zone.cooldownUntil,
    history: historyEvents,
  };
}

async function fetchRealParcelDetail(
  parcelId: string,
  authToken: string,
): Promise<ParcelDetail> {
  const parcel = await apiFetch<ApiParcel>(`/parcels/${parcelId}`, {}, authToken);

  const to = new Date();
  const from = new Date(to.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const history = await apiFetch<ApiHistory>(
    `/parcels/${parcelId}/history?from=${from.toISOString()}&to=${to.toISOString()}`,
    {},
    authToken,
  ).catch(() => ({ zones: [] as ApiHistoryZone[] }));
  const historyByZone = new Map(history.zones.map((z) => [z.zoneId, z]));

  const intervencion = parcel.zones.filter((z) => z.pestLevel === "INTERVENCION").length;
  const monitoreo = parcel.zones.filter((z) => z.pestLevel === "MONITOREO").length;
  const badge =
    intervencion > 0
      ? { tone: "danger" as const, label: `${intervencion} zona(s) en intervención` }
      : monitoreo > 0
        ? { tone: "warn" as const, label: `${monitoreo} zona(s) en monitoreo` }
        : { tone: "ok" as const, label: "Todo normal" };

  return {
    id: parcel.id,
    name: parcel.name,
    crop: parcel.crop,
    area: parcel.location,
    zonesCount: parcel.zones.length,
    badge,
    ownerId: parcel.ownerId,
    zones: parcel.zones.map((zone) => toZoneDetail(zone, historyByZone.get(zone.id))),
  };
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
  return fetchRealParcelDetail(parcelId, authToken);
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

  await apiFetch(
    `/zones/${encodeURIComponent(zoneId)}/treat`,
    { method: "POST" },
    authToken,
  );
  const now = Date.now();
  return {
    activatedAt: new Date(now).toISOString(),
    cooldownUntil: new Date(now + PARCEL_TREATMENT_COOLDOWN_MS).toISOString(),
  };
}

export function isZoneInCooldown(cooldownUntil: string | null): boolean {
  if (!cooldownUntil) {
    return false;
  }
  return Date.parse(cooldownUntil) > Date.now();
}
