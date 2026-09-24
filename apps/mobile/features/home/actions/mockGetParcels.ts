import type { Parcel, ParcelSummary } from '@/shared/types/parcel';
import { mockParcels } from '@/shared/mocks/parcels';

// GET /parcels (BE-023/BE-024) — mock mientras no está desplegado.
// Agregación de estado (spec-005 RF-4): si alguna zona está en INTERVENCION,
// la parcela muestra el tono crítico y el nombre de esa zona como alerta.

function aggregate(zones: Parcel['zones']): ParcelSummary['aggregate'] {
  return zones.some((z) => z.pestState === 'INTERVENCION') ? 'INTERVENCION' : 'NORMAL';
}

export async function mockGetParcelSummaries(): Promise<ParcelSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockParcels.map((parcel) => {
    const alertZone = parcel.zones.find((z) => z.pestState === 'INTERVENCION');
    return {
      id: parcel.id,
      ownerId: parcel.ownerId,
      name: parcel.name,
      location: parcel.location,
      crop: parcel.crop,
      areaHa: parcel.areaHa,
      zoneCount: parcel.zoneCount,
      aggregate: aggregate(parcel.zones),
      alertZoneName: alertZone?.name ?? null,
      lastReadAt: parcel.lastReadAt,
    };
  });
}