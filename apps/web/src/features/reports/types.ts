export interface HistoryDailyPoint {
  label: string;
  minutes: number;
}

export type HistoryEventTone = "ok" | "danger" | "info";

export type HistoryEventKind =
  | "treatment"
  | "pest"
  | "anomaly"
  | "backup-irrigation";

export interface HistoryEvent {
  id: string;
  date: string;
  title: string;
  detail?: string;
  zoneId?: string;
  tone: HistoryEventTone;
  kind: HistoryEventKind;
}

export interface HistoryChart {
  days: HistoryDailyPoint[];
  referenceMinutes: number;
  yMaxMinutes: number;
}

export interface ParcelHistoryReport {
  parcelId: string;
  range: { from: string; to: string };
  stats: {
    totalMinutes: number;
    savingsPercent: number;
    interventions: number;
  };
  chart: HistoryChart;
  zones: string[];
  events: HistoryEvent[];
}