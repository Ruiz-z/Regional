import { Ionicons } from "@expo/vector-icons";

import type { BadgeTone } from "@/shared/ui/Badge";
import type { ZoneIrrigationState, ZonePestState } from "@/shared/types/parcel";

export interface StatusBadgeSpec {
  label: string;
  tone: BadgeTone;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

// Riego — m-parcela: Regando (water), Corrigiendo (info), Normal (ok), Anomalía (danger).
const irrigationMap: Record<ZoneIrrigationState, StatusBadgeSpec> = {
  UNKNOWN: { label: "Sin datos", tone: "info", icon: "help-circle" },
  REGANDO: { label: "Regando", tone: "water", icon: "water" },
  CORRIGIENDO: { label: "Corrigiendo", tone: "info", icon: "refresh" },
  ANOMALIA: { label: "Anomalía", tone: "danger", icon: "warning" },
  NORMAL: { label: "Normal", tone: "ok", icon: "checkmark-circle" },
};

// Plaga — m-parcela/m-zona: Normal (ok), Monitoreo (warn), Intervención (danger).
const pestMap: Record<ZonePestState, StatusBadgeSpec> = {
  UNKNOWN: { label: "Sin datos", tone: "info", icon: "help-circle" },
  INTERVENCION: { label: "Intervención", tone: "danger", icon: "alert-circle" },
  MONITOREO: { label: "Monitoreo", tone: "warn", icon: "warning" },
  NORMAL: { label: "Normal", tone: "ok", icon: "checkmark-circle" },
};

export function irrigationBadge(state: ZoneIrrigationState): StatusBadgeSpec {
  return irrigationMap[state];
}

export function pestBadge(state: ZonePestState): StatusBadgeSpec {
  return pestMap[state];
}
