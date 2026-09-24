import type { ParcelSummary } from '@/shared/types/parcel';
import { env } from '@/shared/lib/env';
import { api, ApiError } from '@/shared/lib/api';
import { mockGetParcelSummaries } from '@/features/home/actions/mockGetParcels';

const PARCELS_PATH = '/parcels';

// Listado del Agricultor (spec-002 RF-3: solo sus parcelas). Sin
// EXPO_PUBLIC_API_URL usa el mock; con API real llama GET /parcels.
export async function getParcelSummaries(): Promise<ParcelSummary[]> {
  if (env.isMock) {
    return mockGetParcelSummaries();
  }

  try {
    const res = await api.get<
      {
        id: string;
        name: string;
        location: string;
        crop: string;
        areaHa: number;
        zoneCount: number;
        aggregate: ParcelSummary['aggregate'];
        alertZoneName: string | null;
        lastReadAt: string | null;
      }[]
    >(PARCELS_PATH);

    return res.map((p) => ({
      id: p.id,
      ownerId: '',
      name: p.name,
      location: p.location,
      crop: p.crop,
      areaHa: p.areaHa,
      zoneCount: p.zoneCount,
      aggregate: p.aggregate,
      alertZoneName: p.alertZoneName,
      lastReadAt: p.lastReadAt,
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.status === 0 ? 'No se pudo conectar al servidor' : error.message);
    }
    throw error;
  }
}