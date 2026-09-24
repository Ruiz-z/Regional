import type { DashboardData } from "@/features/dashboard/types";

export const DASHBOARD_MOCK: DashboardData = {
  alerts: [
    {
      id: "a1",
      parcelId: "norte",
      tone: "danger",
      title: "Foco de plaga confirmado",
      subtitle:
        "Parcela Norte · Zona B3 · 7 detecciones confirmadas · hace 4 min",
    },
    {
      id: "a2",
      parcelId: "norte",
      tone: "danger",
      title: "Anomalía de riego",
      subtitle:
        "Parcela Norte · Zona B1 · 3 riegos seguidos sin subir humedad · hace 20 min",
    },
    {
      id: "a3",
      parcelId: "norte",
      tone: "info",
      title: "Corrección por lluvia insuficiente",
      subtitle:
        "Parcela Norte · Zona A2 · el sistema pospuso el riego, no fue suficiente, inició riego de respaldo · hace 1 h",
    },
  ],
  humidityLegend: [
    { label: "A1", tone: "water" },
    { label: "A2", tone: "savings" },
    { label: "B1", tone: "warn" },
  ],
  humiditySeries: [
    { name: "A1", tone: "water", points: [60, 55, 62, 58, 60, 57, 58] },
    { name: "A2", tone: "savings", points: [95, 92, 90, 88, 85, 87, 84] },
    { name: "B1", tone: "warn", points: [110, 105, 101, 100, 103, 108, 109], dashed: true },
  ],
  humidityLabels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "Ahora"],
  consumption: [
    { label: "Lun", minutes: 40 },
    { label: "Mar", minutes: 55 },
    { label: "Mié", minutes: 35 },
    { label: "Jue", minutes: 65 },
    { label: "Vie", minutes: 50 },
    { label: "Sáb", minutes: 60 },
    { label: "Dom", minutes: 45 },
  ],
  pestSummary: {
    normal: 10,
    monitoreo: 1,
    intervencion: 1,
  },
  parcels: [
    {
      id: "norte",
      name: "Parcela Norte",
      crop: "Vid",
      area: "3.2 ha",
      zonesCount: 6,
      alertBorder: true,
      badge: { tone: "danger", label: "1 zona en intervención" },
      lastReading: "hace 3 min",
      zones: [
        { id: "norte-a1", name: "A1", humidityPct: 58, statusLabel: "Regando", tone: "water" },
        { id: "norte-a2", name: "A2", humidityPct: 52, statusLabel: "Corrigiendo", tone: "info" },
        { id: "norte-a3", name: "A3", humidityPct: 49, statusLabel: "Normal", tone: "ok" },
        { id: "norte-b1", name: "B1", humidityPct: 41, statusLabel: "Anomalía", tone: "danger" },
        { id: "norte-b2", name: "B2", humidityPct: 46, statusLabel: "Monitoreo", tone: "warn" },
        {
          id: "norte-b3",
          name: "B3",
          humidityPct: 31,
          statusLabel: "Intervención",
          tone: "danger",
          selected: true,
        },
      ],
    },
    {
      id: "sur",
      name: "Parcela Sur",
      crop: "Vid",
      area: "2.1 ha",
      zonesCount: 6,
      badge: { tone: "ok", label: "Todo normal" },
      lastReading: "hace 5 min",
      zones: [
        { id: "sur-c1", name: "C1", humidityPct: 55, statusLabel: "Normal", tone: "ok" },
        { id: "sur-c2", name: "C2", humidityPct: null, statusLabel: "Sin lectura", tone: "off" },
        { id: "sur-c3", name: "C3", humidityPct: 51, statusLabel: "Normal", tone: "ok" },
        { id: "sur-c4", name: "C4", humidityPct: 48, statusLabel: "Normal", tone: "ok" },
        { id: "sur-c5", name: "C5", humidityPct: 50, statusLabel: "Normal", tone: "ok" },
        { id: "sur-c6", name: "C6", humidityPct: 53, statusLabel: "Regando", tone: "water" },
      ],
    },
  ],
  activity: [
    {
      id: "e1",
      time: "Hoy 10:05",
      tone: "danger",
      title: "Plaga confirmada en Parcela Norte · B3",
      detail: "7 detecciones",
    },
    {
      id: "e2",
      time: "Hoy 09:50",
      tone: "warn",
      title: "Anomalía de riego en Parcela Norte · B1",
      detail: "3 riegos sin subir humedad",
    },
    {
      id: "e3",
      time: "Hoy 08:15",
      tone: "info",
      title: "Corrección por lluvia insuficiente en Parcela Norte · A2",
      detail: "riego de respaldo iniciado",
    },
    {
      id: "e4",
      time: "Hoy 06:30",
      tone: "water",
      title: "Riego ejecutado en Parcela Sur · C6",
      detail: "18 min",
    },
  ],
};