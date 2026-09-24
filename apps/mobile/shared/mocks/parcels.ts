import type { Parcel, Zone } from '@/shared/types/parcel';

// Dataset mock de parcelas/zonas mientras BE-023/BE-024, BE-028/BE-029/BE-030
// no están desplegados. Refleja el estado de site/m-inicio.html, m-parcela.html
// y m-zona.html (Parcela Norte con foco en B3, Parcela Sur todo normal).
// Se reemplaza por la API real vía EXPO_PUBLIC_API_URL (ver shared/lib/env.ts).

const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString();

const northZones: Zone[] = [
  {
    id: 'zone-a1',
    parcelId: 'parcel-norte',
    name: 'Zona A1',
    humidityThreshold: 45,
    latestHumidity: 58,
    latestTemperature: 24.1,
    pestState: 'NORMAL',
    irrigation: 'REGANDO',
    pestDetectionCount: 0,
    lastTreatmentAt: null,
  },
  {
    id: 'zone-a2',
    parcelId: 'parcel-norte',
    name: 'Zona A2',
    humidityThreshold: 45,
    latestHumidity: 52,
    latestTemperature: 24.0,
    pestState: 'NORMAL',
    irrigation: 'CORRIGIENDO',
    pestDetectionCount: 0,
    lastTreatmentAt: null,
  },
  {
    id: 'zone-a3',
    parcelId: 'parcel-norte',
    name: 'Zona A3',
    humidityThreshold: 45,
    latestHumidity: 49,
    latestTemperature: 24.2,
    pestState: 'NORMAL',
    irrigation: 'NORMAL',
    pestDetectionCount: 0,
    lastTreatmentAt: null,
  },
  {
    id: 'zone-b1',
    parcelId: 'parcel-norte',
    name: 'Zona B1',
    humidityThreshold: 45,
    latestHumidity: 41,
    latestTemperature: 24.4,
    pestState: 'NORMAL',
    irrigation: 'ANOMALIA',
    pestDetectionCount: 0,
    lastTreatmentAt: minutesAgo(20),
  },
  {
    id: 'zone-b2',
    parcelId: 'parcel-norte',
    name: 'Zona B2',
    humidityThreshold: 45,
    latestHumidity: 46,
    latestTemperature: 24.3,
    pestState: 'MONITOREO',
    irrigation: 'NORMAL',
    pestDetectionCount: 2,
    lastTreatmentAt: null,
  },
  {
    id: 'zone-b3',
    parcelId: 'parcel-norte',
    name: 'Zona B3',
    humidityThreshold: 45,
    latestHumidity: 31,
    latestTemperature: 27.4,
    pestState: 'INTERVENCION',
    irrigation: 'NORMAL',
    pestDetectionCount: 7,
    lastTreatmentAt: null,
  },
];

const southZones: Zone[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((name, i) => ({
  id: `zone-${name.toLowerCase()}`,
  parcelId: 'parcel-sur',
  name: `Zona ${name}`,
  humidityThreshold: 45,
  latestHumidity: 52 - i,
  latestTemperature: 23.5 + i * 0.1,
  pestState: 'NORMAL' as const,
  irrigation: 'NORMAL' as const,
  pestDetectionCount: 0,
  lastTreatmentAt: null,
}));

export const mockParcels: Parcel[] = [
  {
    id: 'parcel-norte',
    ownerId: 'u_demo_ana',
    name: 'Parcela Norte',
    location: 'Cd. Juárez, Chihuahua',
    crop: 'Vid',
    areaHa: 3.2,
    zoneCount: northZones.length,
    zones: northZones,
    lastReadAt: minutesAgo(4),
  },
  {
    id: 'parcel-sur',
    ownerId: 'u_demo_ana',
    name: 'Parcela Sur',
    location: 'Cd. Juárez, Chihuahua',
    crop: 'Vid',
    areaHa: 2.1,
    zoneCount: southZones.length,
    zones: southZones,
    lastReadAt: minutesAgo(5),
  },
];