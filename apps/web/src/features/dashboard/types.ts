import type { ToneKind } from "@/shared/components/ui/tone-badge";
import type { ZoneSnapshot } from "@/features/zones/components/zone-cell";

export type AlertTone = "danger" | "info";

export interface DashboardAlert {
  id: string;
  parcelId: string;
  tone: AlertTone;
  title: string;
  subtitle: string;
}

export interface HumiditySeriesPoint {
  value: number;
}

export interface HumiditySeries {
  name: string;
  tone: "water" | "savings" | "warn";
  points: number[];
  dashed?: boolean;
}

export interface ConsumptionDay {
  label: string;
  minutes: number;
}

export interface PestSummary {
  normal: number;
  monitoreo: number;
  intervencion: number;
}

export interface ParcelSummary {
  id: string;
  name: string;
  crop: string;
  area: string;
  zonesCount: number;
  badge: { tone: ToneKind; label: string } | null;
  alertBorder?: boolean;
  lastReading: string;
  zones: ZoneSnapshot[];
}

export type ActivityTone = ToneKind;

export interface ActivityEvent {
  id: string;
  time: string;
  tone: ActivityTone;
  title: string;
  detail: string;
}

export interface DashboardData {
  alerts: DashboardAlert[];
  humidityLegend: { label: string; tone: "water" | "savings" | "warn" }[];
  humiditySeries: HumiditySeries[];
  humidityLabels: string[];
  consumption: ConsumptionDay[];
  pestSummary: PestSummary;
  parcels: ParcelSummary[];
  activity: ActivityEvent[];
}