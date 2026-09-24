import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type { ZoneSnapshot, ZoneTone } from "@/features/zones/components/zone-cell";
import type {
  ActivityEvent,
  ConsumptionDay,
  DashboardAlert,
  DashboardData,
  HumiditySeries,
  ParcelSummary,
  PestSummary,
} from "@/features/dashboard/types";

export function isMocksEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_MOCK === "true";
}

// --- Formas reales que devuelve la API (no las presentacionales del front) ---

interface ApiZone {
  id: string;
  name: string;
  humidityThreshold: number;
  latestReading: {
    humidity: number;
    temperature: number;
    createdAt: string;
  } | null;
  pestLevel: "NORMAL" | "MONITOREO" | "INTERVENCION";
}

interface ApiParcel {
  id: string;
  name: string;
  crop: string;
  location: string;
  zones: ApiZone[];
}

interface ApiNotification {
  id: string;
  zoneId: string | null;
  type: "RAIN_CORRECTION" | "IRRIGATION_ANOMALY" | "PEST_ALERT";
  severity: "INFO" | "CRITICAL";
  read: boolean;
  createdAt: string;
}

interface ApiIrrigationEvent {
  id: string;
  zoneId: string;
  durationMinutes: number | null;
  correctedForRain: boolean;
  createdAt: string;
}

interface ApiHistoryZone {
  zoneId: string;
  zoneName: string;
  readings: { humidity: number; temperature: number; createdAt: string }[];
  irrigationEvents: ApiIrrigationEvent[];
}

interface ApiHistory {
  zones: ApiHistoryZone[];
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HUMIDITY_POINTS = 7;
const RECENT_DAYS = 7;

const NOTIFICATION_COPY: Record<
  ApiNotification["type"],
  { title: string; motivo: string }
> = {
  RAIN_CORRECTION: {
    title: "Corrección por lluvia insuficiente",
    motivo: "el sistema pospuso el riego, no fue suficiente, inició riego de respaldo",
  },
  IRRIGATION_ANOMALY: {
    title: "Anomalía de riego",
    motivo: "3 riegos seguidos sin subir humedad",
  },
  PEST_ALERT: {
    title: "Foco de plaga confirmado",
    motivo: "detección sostenida de la plaga objetivo",
  },
};

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

function zoneTone(zone: ApiZone): { tone: ZoneTone; statusLabel: string } {
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

function toParcelSummary(parcel: ApiParcel): ParcelSummary {
  const zones: ZoneSnapshot[] = parcel.zones.map((zone) => {
    const { tone, statusLabel } = zoneTone(zone);
    return {
      id: zone.id,
      name: zone.name,
      humidityPct: zone.latestReading?.humidity ?? null,
      statusLabel,
      tone,
    };
  });

  const intervencion = parcel.zones.filter(
    (z) => z.pestLevel === "INTERVENCION",
  ).length;
  const monitoreo = parcel.zones.filter(
    (z) => z.pestLevel === "MONITOREO",
  ).length;
  const badge =
    intervencion > 0
      ? { tone: "danger" as const, label: `${intervencion} zona(s) en intervención` }
      : monitoreo > 0
        ? { tone: "warn" as const, label: `${monitoreo} zona(s) en monitoreo` }
        : { tone: "ok" as const, label: "Todo normal" };

  const lastReadingAt = parcel.zones
    .map((z) => z.latestReading?.createdAt)
    .filter((v): v is string => !!v)
    .sort()
    .at(-1);

  return {
    id: parcel.id,
    name: parcel.name,
    crop: parcel.crop,
    area: parcel.location,
    zonesCount: parcel.zones.length,
    badge,
    alertBorder: intervencion > 0,
    lastReading: lastReadingAt ? timeAgo(lastReadingAt) : "sin lecturas",
    zones,
  };
}

function toPestSummary(parcels: ApiParcel[]): PestSummary {
  const summary: PestSummary = { normal: 0, monitoreo: 0, intervencion: 0 };
  for (const parcel of parcels) {
    for (const zone of parcel.zones) {
      if (zone.pestLevel === "INTERVENCION") summary.intervencion += 1;
      else if (zone.pestLevel === "MONITOREO") summary.monitoreo += 1;
      else summary.normal += 1;
    }
  }
  return summary;
}

function findZoneAndParcel(
  parcels: ApiParcel[],
  zoneId: string | null,
): { parcel: ApiParcel; zone: ApiZone } | null {
  if (!zoneId) return null;
  for (const parcel of parcels) {
    const zone = parcel.zones.find((z) => z.id === zoneId);
    if (zone) return { parcel, zone };
  }
  return null;
}

function toAlert(
  notification: ApiNotification,
  parcels: ApiParcel[],
): DashboardAlert {
  const copy = NOTIFICATION_COPY[notification.type];
  const match = findZoneAndParcel(parcels, notification.zoneId);
  const location = match
    ? `${match.parcel.name} · Zona ${match.zone.name}`
    : "Zona sin datos";
  return {
    id: notification.id,
    parcelId: match?.parcel.id ?? "",
    tone: notification.severity === "CRITICAL" ? "danger" : "info",
    title: copy.title,
    subtitle: `${location} · ${copy.motivo} · ${timeAgo(notification.createdAt)}`,
  };
}

function buildHumiditySeries(histories: ApiHistoryZone[]): {
  series: HumiditySeries[];
  legend: { label: string; tone: "water" | "savings" | "warn" }[];
  labels: string[];
} {
  const tones: HumiditySeries["tone"][] = ["water", "savings", "warn"];
  const series = histories
    .filter((z) => z.readings.length > 0)
    .slice(0, 3)
    .map((zone, index) => {
      const values = zone.readings.map((r) => r.humidity);
      const padded =
        values.length >= HUMIDITY_POINTS
          ? values.slice(-HUMIDITY_POINTS)
          : Array.from({ length: HUMIDITY_POINTS - values.length })
              .fill(values[0])
              .concat(values);
      return {
        name: zone.zoneName,
        tone: tones[index % tones.length],
        points: padded as number[],
      };
    });
  const labels =
    series.length > 0
      ? Array.from({ length: HUMIDITY_POINTS - 1 }, (_, i) => `-${HUMIDITY_POINTS - 1 - i}`).concat(
          "Ahora",
        )
      : [];
  return {
    series,
    legend: series.map((s) => ({ label: s.name, tone: s.tone })),
    labels,
  };
}

function buildConsumption(histories: ApiHistoryZone[]): ConsumptionDay[] {
  const byWeekday = new Array(7).fill(0) as number[];
  for (const zone of histories) {
    for (const event of zone.irrigationEvents) {
      const day = new Date(event.createdAt).getDay();
      byWeekday[day] += event.durationMinutes ?? 0;
    }
  }
  // Empieza en lunes, como en el resto de la UI.
  return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    label: WEEKDAY_LABELS[day],
    minutes: byWeekday[day],
  }));
}

function buildActivity(
  histories: ApiHistoryZone[],
  parcels: ApiParcel[],
): ActivityEvent[] {
  const events: (ActivityEvent & { at: string })[] = [];
  for (const historyZone of histories) {
    const match = findZoneAndParcel(parcels, historyZone.zoneId);
    const location = match
      ? `${match.parcel.name} · ${historyZone.zoneName}`
      : historyZone.zoneName;
    for (const event of historyZone.irrigationEvents) {
      events.push({
        id: event.id,
        at: event.createdAt,
        time: timeAgo(event.createdAt),
        tone: event.correctedForRain ? "info" : "water",
        title: event.correctedForRain
          ? `Corrección por lluvia insuficiente en ${location}`
          : `Riego ejecutado en ${location}`,
        detail: `${event.durationMinutes ?? 0} min`,
      });
    }
  }
  return events
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 10)
    .map(({ at: _at, ...rest }) => rest);
}

async function fetchJson<T>(path: string, token: string): Promise<T> {
  return apiFetch<T>(path, {}, token);
}

export async function getDashboard(token?: string): Promise<DashboardData> {
  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }

  const parcels = await fetchJson<ApiParcel[]>("/parcels", authToken);
  const notifications = await fetchJson<ApiNotification[]>(
    "/notifications",
    authToken,
  ).catch(() => []);

  const to = new Date();
  const from = new Date(to.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const histories = await Promise.all(
    parcels.map((parcel) =>
      fetchJson<ApiHistory>(
        `/parcels/${parcel.id}/history?from=${from.toISOString()}&to=${to.toISOString()}`,
        authToken,
      ).catch(() => ({ zones: [] as ApiHistoryZone[] })),
    ),
  );
  const historyZones = histories.flatMap((h) => h.zones);

  const { series, legend, labels } = buildHumiditySeries(historyZones);

  return {
    alerts: notifications
      .filter((n) => !n.read)
      .slice(0, 5)
      .map((n) => toAlert(n, parcels)),
    humidityLegend: legend,
    humiditySeries: series,
    humidityLabels: labels,
    consumption: buildConsumption(historyZones),
    pestSummary: toPestSummary(parcels),
    parcels: parcels.map(toParcelSummary),
    activity: buildActivity(historyZones, parcels),
  };
}
