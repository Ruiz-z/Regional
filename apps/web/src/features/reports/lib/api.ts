import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type {
  HistoryDailyPoint,
  HistoryEvent,
  ParcelHistoryReport,
} from "@/features/reports/types";
import { historyMock } from "@/features/reports/lib/mock-data";
import { isMocksEnabled } from "@/features/dashboard/lib/api";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
// Misma línea base fija que usa el backend (spec-007 RF-4, sin valor oficial
// por cultivo todavía) — solo para dibujar la línea de referencia del chart.
const BASELINE_MINUTES_PER_DAY = 20;

interface ApiIrrigationEvent {
  id: string;
  durationMinutes: number | null;
  correctedForRain: boolean;
  createdAt: string;
}

interface ApiPestTreatment {
  id: string;
  trigger: "AUTOMATIC" | "MANUAL";
  executedAt: string;
}

interface ApiHistoryZone {
  zoneId: string;
  zoneName: string;
  minutesRegados: number;
  irrigationEvents: ApiIrrigationEvent[];
  pestTreatments: ApiPestTreatment[];
}

interface ApiHistory {
  zones: ApiHistoryZone[];
  totals: {
    minutesRegados: number;
    ahorradoPorcentaje: number;
  };
}

interface ApiParcel {
  id: string;
  name: string;
}

function historyPath(parcelId: string, from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return `/parcels/${parcelId}/history${query ? `?${query}` : ""}`;
}

function buildDailyPoints(zones: ApiHistoryZone[]): HistoryDailyPoint[] {
  const byWeekday = new Array(7).fill(0) as number[];
  for (const zone of zones) {
    for (const event of zone.irrigationEvents) {
      byWeekday[new Date(event.createdAt).getDay()] += event.durationMinutes ?? 0;
    }
  }
  return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    label: WEEKDAY_LABELS[day],
    minutes: byWeekday[day],
  }));
}

function buildEvents(zones: ApiHistoryZone[]): HistoryEvent[] {
  const events: (HistoryEvent & { at: string })[] = [];
  for (const zone of zones) {
    // Solo los riegos "notables" entran al timeline (corrección por lluvia);
    // un riego normal exitoso no es un evento que valga la pena listar aquí.
    for (const event of zone.irrigationEvents.filter((e) => e.correctedForRain)) {
      events.push({
        id: event.id,
        at: event.createdAt,
        date: new Date(event.createdAt).toLocaleString("es-MX"),
        title: `Corrección por lluvia insuficiente · ${zone.zoneName}`,
        detail: `${event.durationMinutes ?? 0} min`,
        zoneId: zone.zoneName,
        tone: "info",
        kind: "backup-irrigation",
      });
    }
    for (const treatment of zone.pestTreatments) {
      events.push({
        id: treatment.id,
        at: treatment.executedAt,
        date: new Date(treatment.executedAt).toLocaleString("es-MX"),
        title: `Tratamiento de plaga (${treatment.trigger === "MANUAL" ? "manual" : "automático"}) · ${zone.zoneName}`,
        zoneId: zone.zoneName,
        tone: "danger",
        kind: "treatment",
      });
    }
  }
  return events
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map(({ at: _at, ...rest }) => rest);
}

function toReport(
  parcelId: string,
  from: string,
  to: string,
  history: ApiHistory,
): ParcelHistoryReport {
  const days = buildDailyPoints(history.zones);
  const interventions = history.zones.reduce(
    (sum, z) => sum + z.pestTreatments.length,
    0,
  );
  return {
    parcelId,
    range: { from, to },
    stats: {
      totalMinutes: history.totals.minutesRegados,
      savingsPercent: history.totals.ahorradoPorcentaje,
      interventions,
    },
    chart: {
      days,
      referenceMinutes: BASELINE_MINUTES_PER_DAY,
      yMaxMinutes: Math.max(
        BASELINE_MINUTES_PER_DAY * 1.5,
        ...days.map((d) => d.minutes),
      ),
    },
    zones: history.zones.map((z) => z.zoneName),
    events: buildEvents(history.zones),
  };
}

function mergeHistories(histories: ApiHistory[]): ApiHistory {
  return {
    zones: histories.flatMap((h) => h.zones),
    totals: {
      minutesRegados: histories.reduce((s, h) => s + h.totals.minutesRegados, 0),
      ahorradoPorcentaje:
        histories.length > 0
          ? Math.round(
              histories.reduce((s, h) => s + h.totals.ahorradoPorcentaje, 0) /
                histories.length,
            )
          : 0,
    },
  };
}

export async function getParcelHistory(
  parcelId: string,
  from?: string,
  to?: string,
  token?: string,
): Promise<ParcelHistoryReport> {
  if (isMocksEnabled()) {
    return historyMock(parcelId);
  }

  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }

  const fromIso = from ? new Date(from).toISOString() : undefined;
  const toIso = to ? new Date(to).toISOString() : undefined;

  if (parcelId === "all") {
    const parcels = await apiFetch<ApiParcel[]>("/parcels", {}, authToken);
    const histories = await Promise.all(
      parcels.map((p) =>
        apiFetch<ApiHistory>(historyPath(p.id, fromIso, toIso), {}, authToken),
      ),
    );
    return toReport("all", from ?? "", to ?? "", mergeHistories(histories));
  }

  const history = await apiFetch<ApiHistory>(
    historyPath(parcelId, fromIso, toIso),
    {},
    authToken,
  );
  return toReport(parcelId, from ?? "", to ?? "", history);
}
