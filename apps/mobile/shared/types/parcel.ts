// Estados y entidades de parcela/zona derivados de specs 004/005/006
// (no del mockup): los estados de riego/plaga salen de IrrigationDecision,
// PestTreatment.trigger y la clasificación Normal/Monitoreo/Intervención
// de la spec-005 RF-4.

export type ZonePestState = "NORMAL" | "MONITOREO" | "INTERVENCION" | "UNKNOWN";

// Estado de riego visible: deriva de IrrigationDecision (REGAR/ESPERAR),
// corrección por lluvia (spec-004 RF-8) y anomalía (spec-004 RF-9).
export type ZoneIrrigationState =
  "NORMAL" | "REGANDO" | "CORRIGIENDO" | "ANOMALIA" | "UNKNOWN";

export interface Zone {
  id: string;
  parcelId: string;
  name: string;
  humidityThreshold: number;
  latestHumidity: number | null;
  latestTemperature: number | null;
  pestState: ZonePestState;
  irrigation: ZoneIrrigationState;
  pestDetectionCount: number | null;
  lastTreatmentAt: string | null;
}

export interface Parcel {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  crop: string;
  areaHa: number | null;
  zoneCount: number;
  zones: Zone[];
  lastReadAt: string | null;
}

// Estado agregado de la parcela: si alguna zona está en Intervención,
// la parcela muestra el tono más crítico de su zona (spec-005 RF-4).
export type ParcelAggregateState = ZonePestState;

export interface ParcelSummary extends Omit<Parcel, "zones"> {
  aggregate: ParcelAggregateState;
  alertZoneName: string | null;
}
