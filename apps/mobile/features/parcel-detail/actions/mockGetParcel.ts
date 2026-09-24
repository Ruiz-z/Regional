import type { Parcel } from '@/shared/types/parcel';
import { mockParcels } from '@/shared/mocks/parcels';

// GET /parcels/:id (BE-023/BE-024) — mock mientras no está desplegado.
export async function mockGetParcel(id: string): Promise<Parcel> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const parcel = mockParcels.find((p) => p.id === id);
  if (!parcel) {
    throw new Error('Parcela no encontrada');
  }
  return parcel;
}