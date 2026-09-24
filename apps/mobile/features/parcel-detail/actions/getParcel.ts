import type { Parcel } from '@/shared/types/parcel';
import { env } from '@/shared/lib/env';
import { api, ApiError } from '@/shared/lib/api';
import { mockGetParcel } from '@/features/parcel-detail/actions/mockGetParcel';

const PARCEL_PATH = (id: string): string => `/parcels/${id}`;

// Detalle de parcela con sus zonas (spec-002 RF-3: solo parcelas del Agricultor).
export async function getParcel(id: string): Promise<Parcel> {
  if (env.isMock) {
    return mockGetParcel(id);
  }

  try {
    const p = await api.get<{
      id: string;
      ownerId: string;
      name: string;
      location: string;
      crop: string;
      areaHa: number;
      zoneCount: number;
      lastReadAt: string | null;
      zones: Array<{
        id: string;
        parcelId: string;
        name: string;
        humidityThreshold: number;
        latestHumidity: number;
        latestTemperature: number;
        pestState: 'NORMAL' | 'MONITOREO' | 'INTERVENCION';
        irrigation: 'NORMAL' | 'REGANDO' | 'CORRIGIENDO' | 'ANOMALIA';
        pestDetectionCount: number;
        lastTreatmentAt: string | null;
      }>;
    }>(PARCEL_PATH(id));

    return {
      id: p.id,
      ownerId: p.ownerId,
      name: p.name,
      location: p.location,
      crop: p.crop,
      areaHa: p.areaHa,
      zoneCount: p.zoneCount,
      lastReadAt: p.lastReadAt,
      zones: p.zones.map((z) => ({
        id: z.id,
        parcelId: z.parcelId,
        name: z.name,
        humidityThreshold: z.humidityThreshold,
        latestHumidity: z.latestHumidity,
        latestTemperature: z.latestTemperature,
        pestState: z.pestState,
        irrigation: z.irrigation,
        pestDetectionCount: z.pestDetectionCount,
        lastTreatmentAt: z.lastTreatmentAt,
      })),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.status === 404 ? 'Parcela no encontrada' : error.message);
    }
    throw error;
  }
}