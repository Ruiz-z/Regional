// Estados y entidades de parcela/zona derivados de specs 004/005/006
// (no del mockup): los estados de riego/plaga salen de IrrigationDecision,
// PestTreatment.trigger y la clasificación Normal/Monitoreo/Intervención
// de la spec-005 RF-4.

export type ZonePestState = 'NORMAL' | 'MONITOREO' | 'INTERVENCION';

// Estado de riego visible: deriva de IrrigationDecision (REGAR/ESPERAR),
// corrección por lluvia (spec-004 RF-8) y anomalía (spec-004 RF-9).
export type ZoneIrrigationState = 'NORMAL' | 'REGANDO' | 'CORRIGIENDO' | 'ANOMALIA';

export interface Zone {
  id: string;
  parcelId: string;
  name: string;
  humidityThreshold: number;
  latestHumidity: number;
  latestTemperature: number;
  pestState: ZonePestState;
  irrigation: ZoneIrrigationState;
  pestDetectionCount: number;
  lastTreatmentAt: string | null;
}

export interface Parcel {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  crop: string;
  areaHa: number;
  zoneCount: number;
  zones: Zone[];
  lastReadAt: string | null;
}

// Estado agregado de la parcela: si alguna zona está en Intervención,
// la parcela muestra el tono más crítico de su zona (spec-005 RF-4).
export type ParcelAggregateState = 'NORMAL' | 'INTERVENCION';

export interface ParcelSummary extends Omit<Parcel, 'zones'> {
  aggregate: ParcelAggregateState;
  alertZoneName: string | null;
}