import type { ParcelHistoryReport } from "@/features/reports/types";

export const HISTORY_RANGE = {
  from: "2026-09-16",
  to: "2026-09-22",
};

const NORTH_DAYS = [
  { label: "Lun", minutes: 0 },
  { label: "Mar", minutes: 15 },
  { label: "Mié", minutes: 12 },
  { label: "Jue", minutes: 31 },
  { label: "Vie", minutes: 23 },
  { label: "Sáb", minutes: 35 },
  { label: "Dom", minutes: 27 },
  { label: "Hoy", minutes: 42 },
];

const SOUTH_DAYS = [
  { label: "Lun", minutes: 8 },
  { label: "Mar", minutes: 20 },
  { label: "Mié", minutes: 14 },
  { label: "Jue", minutes: 28 },
  { label: "Vie", minutes: 18 },
  { label: "Sáb", minutes: 31 },
  { label: "Dom", minutes: 22 },
  { label: "Hoy", minutes: 34 },
];

const NORTH_REPORT: ParcelHistoryReport = {
  parcelId: "norte",
  range: HISTORY_RANGE,
  stats: {
    totalMinutes: 312,
    savingsPercent: -23,
    interventions: 1,
  },
  chart: {
    days: NORTH_DAYS,
    referenceMinutes: 35,
    yMaxMinutes: 60,
  },
  zones: ["A1", "A2", "A3", "B1", "B2", "B3"],
  events: [
    {
      id: "n1",
      date: "Hoy 10:12",
      title: "Tratamiento aplicado en B3",
      zoneId: "B3",
      tone: "ok",
      kind: "treatment",
    },
    {
      id: "n2",
      date: "Hoy 10:05",
      title: "Plaga confirmada en B3",
      detail: "7 detecciones",
      zoneId: "B3",
      tone: "danger",
      kind: "pest",
    },
    {
      id: "n3",
      date: "Hoy 09:50",
      title: "Anomalía de riego en B1",
      detail: "3 riegos sin subir humedad",
      zoneId: "B1",
      tone: "danger",
      kind: "anomaly",
    },
    {
      id: "n4",
      date: "Hoy 08:15",
      title: "Riego de respaldo en A2",
      detail: "lluvia insuficiente",
      zoneId: "A2",
      tone: "info",
      kind: "backup-irrigation",
    },
  ],
};

const SOUTH_REPORT: ParcelHistoryReport = {
  parcelId: "sur",
  range: HISTORY_RANGE,
  stats: {
    totalMinutes: 208,
    savingsPercent: -14,
    interventions: 0,
  },
  chart: {
    days: SOUTH_DAYS,
    referenceMinutes: 32,
    yMaxMinutes: 60,
  },
  zones: ["C1", "C2", "C3", "C4", "C5", "C6"],
  events: [
    {
      id: "s1",
      date: "Ayer 17:40",
      title: "Riego de respaldo en C4",
      detail: "lluvia insuficiente",
      zoneId: "C4",
      tone: "info",
      kind: "backup-irrigation",
    },
    {
      id: "s2",
      date: "Ayer 12:05",
      title: "Riego de respaldo en C1",
      detail: "lluvia insuficiente",
      zoneId: "C1",
      tone: "info",
      kind: "backup-irrigation",
    },
  ],
};

const ALL_REPORT: ParcelHistoryReport = {
  parcelId: "all",
  range: HISTORY_RANGE,
  stats: {
    totalMinutes:
      NORTH_REPORT.stats.totalMinutes + SOUTH_REPORT.stats.totalMinutes,
    savingsPercent: -19,
    interventions:
      NORTH_REPORT.stats.interventions + SOUTH_REPORT.stats.interventions,
  },
  chart: {
    days: NORTH_REPORT.chart.days.map((day, index) => ({
      label: day.label,
      minutes: day.minutes + SOUTH_REPORT.chart.days[index].minutes,
    })),
    referenceMinutes: NORTH_REPORT.chart.referenceMinutes + 4,
    yMaxMinutes: 60,
  },
  zones: [...NORTH_REPORT.zones, ...SOUTH_REPORT.zones],
  events: [...NORTH_REPORT.events, ...SOUTH_REPORT.events],
};

const MOCKS: Record<string, ParcelHistoryReport> = {
  norte: NORTH_REPORT,
  sur: SOUTH_REPORT,
  all: ALL_REPORT,
};

export function historyMock(parcelId: string): ParcelHistoryReport {
  return MOCKS[parcelId] ?? ALL_REPORT;
}