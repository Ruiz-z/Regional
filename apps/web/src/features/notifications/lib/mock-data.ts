import type { NotificationItem } from "@/features/notifications/types";

export const NOTIFICATIONS_MOCK: NotificationItem[] = [
  {
    id: "n1",
    severity: "CRITICA",
    read: false,
    title: "Foco de plaga confirmado · Zona B3",
    meta: "Parcela Norte · 7 detecciones · hace 4 min",
    parcelId: "norte",
  },
  {
    id: "n2",
    severity: "CRITICA",
    read: false,
    title: "Anomalía de riego · Zona B1",
    meta: "Parcela Norte · 3 riegos sin subir humedad · hace 20 min",
    parcelId: "norte",
  },
  {
    id: "n3",
    severity: "INFORMATIVA",
    read: true,
    title: "Corrección por lluvia insuficiente · Zona A2",
    meta: "Parcela Norte · el sistema pospuso el riego, no fue suficiente, inició riego de respaldo · hace 1 h",
    parcelId: "norte",
  },
  {
    id: "n4",
    severity: "INFORMATIVA",
    read: true,
    title: "Corrección por lluvia insuficiente · Zona C4",
    meta: "Parcela Sur · riego de respaldo iniciado · ayer",
    parcelId: "sur",
  },
];