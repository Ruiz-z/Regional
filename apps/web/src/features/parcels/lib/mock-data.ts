import type { ParcelDetail, ZoneDetail } from "@/features/parcels/types";

export const MOCK_OWNER_ID = "00000000-0000-0000-0000-000000000000";

type RawZoneDetail = Omit<ZoneDetail, "id">;
type RawParcelDetail = Omit<ParcelDetail, "zones"> & {
  zones: RawZoneDetail[];
};

export const PARCELS_MOCK: Record<string, RawParcelDetail> = {
  norte: {
    id: "norte",
    name: "Parcela Norte",
    crop: "Vid",
    area: "3.2 ha",
    zonesCount: 6,
    badge: { tone: "danger", label: "1 zona en intervención" },
    ownerId: MOCK_OWNER_ID,
    zones: [
      {
        cell: { id: "norte-a1", name: "A1", humidityPct: 58, statusLabel: "Regando", tone: "water" },
        size: "0.6 ha",
        targetPct: 45,
        temperatureC: 26.8,
        irrigation: { tone: "water", label: "Riego: Regando" },
        pest: { tone: "ok", label: "Plaga: Normal" },
        pestState: "NORMAL",
        cooldownUntil: null,
        history: [
          { id: "h-a1-1", time: "Hoy 07:10", tone: "water", title: "Riego ejecutado", detail: "14 min" },
        ],
      },
      {
        cell: { id: "norte-a2", name: "A2", humidityPct: 52, statusLabel: "Corrigiendo", tone: "info" },
        size: "0.5 ha",
        targetPct: 45,
        temperatureC: 26.9,
        irrigation: { tone: "info", label: "Riego: Corrigiendo" },
        pest: { tone: "ok", label: "Plaga: Normal" },
        pestState: "NORMAL",
        cooldownUntil: null,
        history: [
          { id: "h-a2-1", time: "Hoy 08:15", tone: "info", title: "Corrección por lluvia insuficiente", detail: "riego de respaldo iniciado" },
          { id: "h-a2-2", time: "Hoy 06:30", tone: "water", title: "Riego ejecutado", detail: "16 min" },
        ],
      },
      {
        cell: { id: "norte-a3", name: "A3", humidityPct: 49, statusLabel: "Normal", tone: "ok" },
        size: "0.6 ha",
        targetPct: 45,
        temperatureC: 27.1,
        irrigation: { tone: "ok", label: "Riego: Normal" },
        pest: { tone: "ok", label: "Plaga: Normal" },
        pestState: "NORMAL",
        cooldownUntil: null,
        history: [
          { id: "h-a3-1", time: "Ayer 07:00", tone: "water", title: "Riego ejecutado", detail: "15 min" },
        ],
      },
      {
        cell: { id: "norte-b1", name: "B1", humidityPct: 41, statusLabel: "Anomalía", tone: "danger" },
        size: "0.5 ha",
        targetPct: 45,
        temperatureC: 27.5,
        irrigation: { tone: "danger", label: "Riego: Anomalía" },
        pest: { tone: "ok", label: "Plaga: Normal" },
        pestState: "NORMAL",
        cooldownUntil: null,
        history: [
          { id: "h-b1-1", time: "Hoy 09:50", tone: "warn", title: "Anomalía de riego detectada", detail: "3 riegos sin subir humedad" },
        ],
      },
      {
        cell: { id: "norte-b2", name: "B2", humidityPct: 46, statusLabel: "Monitoreo", tone: "warn" },
        size: "0.5 ha",
        targetPct: 45,
        temperatureC: 27.3,
        irrigation: { tone: "ok", label: "Riego: Normal" },
        pest: { tone: "warn", label: "Plaga: Monitoreo", detections: 4 },
        pestState: "MONITOREO",
        cooldownUntil: null,
        history: [
          { id: "h-b2-1", time: "Hoy 11:20", tone: "warn", title: "Plaga en monitoreo por cámara", detail: "4 detecciones" },
        ],
      },
      {
        cell: { id: "norte-b3", name: "B3", humidityPct: 31, statusLabel: "Intervención", tone: "danger", selected: true },
        size: "0.5 ha",
        targetPct: 45,
        temperatureC: 27.4,
        irrigation: { tone: "ok", label: "Riego: Normal" },
        pest: { tone: "danger", label: "Plaga: Intervención", detections: 7 },
        pestState: "INTERVENCION",
        cooldownUntil: null,
        history: [
          { id: "h-b3-1", time: "Hoy 10:05", tone: "danger", title: "Plaga confirmada por cámara", detail: "7 detecciones" },
          { id: "h-b3-2", time: "Hoy 09:50", tone: "warn", title: "Anomalía de riego detectada", detail: "3 riegos sin subir humedad" },
          { id: "h-b3-3", time: "Ayer 06:30", tone: "water", title: "Riego ejecutado", detail: "16 min" },
        ],
      },
    ],
  },
  sur: {
    id: "sur",
    name: "Parcela Sur",
    crop: "Vid",
    area: "2.1 ha",
    zonesCount: 6,
    badge: { tone: "ok", label: "Todo normal" },
    ownerId: MOCK_OWNER_ID,
    zones: [
      { cell: { id: "sur-c1", name: "C1", humidityPct: 55, statusLabel: "Normal", tone: "ok" }, size: "0.4 ha", targetPct: 45, temperatureC: 27.0, irrigation: { tone: "ok", label: "Riego: Normal" }, pest: { tone: "ok", label: "Plaga: Normal" }, pestState: "NORMAL", cooldownUntil: null, history: [] },
      { cell: { id: "sur-c2", name: "C2", humidityPct: null, statusLabel: "Sin lectura", tone: "off" }, size: "0.4 ha", targetPct: 45, temperatureC: null, irrigation: { tone: "off", label: "Riego: Sin lectura" }, pest: { tone: "ok", label: "Plaga: Normal" }, pestState: "NORMAL", cooldownUntil: null, history: [] },
      { cell: { id: "sur-c3", name: "C3", humidityPct: 51, statusLabel: "Normal", tone: "ok" }, size: "0.4 ha", targetPct: 45, temperatureC: 26.7, irrigation: { tone: "ok", label: "Riego: Normal" }, pest: { tone: "ok", label: "Plaga: Normal" }, pestState: "NORMAL", cooldownUntil: null, history: [] },
      { cell: { id: "sur-c4", name: "C4", humidityPct: 48, statusLabel: "Normal", tone: "ok" }, size: "0.3 ha", targetPct: 45, temperatureC: 27.2, irrigation: { tone: "ok", label: "Riego: Normal" }, pest: { tone: "ok", label: "Plaga: Normal" }, pestState: "NORMAL", cooldownUntil: null, history: [] },
      { cell: { id: "sur-c5", name: "C5", humidityPct: 50, statusLabel: "Normal", tone: "ok" }, size: "0.3 ha", targetPct: 45, temperatureC: 26.6, irrigation: { tone: "ok", label: "Riego: Normal" }, pest: { tone: "ok", label: "Plaga: Normal" }, pestState: "NORMAL", cooldownUntil: null, history: [] },
      { cell: { id: "sur-c6", name: "C6", humidityPct: 53, statusLabel: "Regando", tone: "water" }, size: "0.3 ha", targetPct: 45, temperatureC: 26.5, irrigation: { tone: "water", label: "Riego: Regando" }, pest: { tone: "ok", label: "Plaga: Normal" }, pestState: "NORMAL", cooldownUntil: null, history: [{ id: "h-c6-1", time: "Hoy 06:30", tone: "water", title: "Riego ejecutado", detail: "18 min" }] },
    ],
  },
};