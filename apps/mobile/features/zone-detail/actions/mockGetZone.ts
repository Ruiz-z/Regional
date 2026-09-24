import type { Parcel, Zone } from '@/shared/types/parcel';
import { mockParcels } from '@/shared/mocks/parcels';

// GET /zones/:id (BE-028/BE-030) — mock mientras no está desplegado.
export async function mockGetZone(id: string): Promise<{ zone: Zone; parcel: Parcel }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  for (const parcel of mockParcels) {
    const zone = parcel.zones.find((z) => z.id === id);
    if (zone) {
      return { zone, parcel };
    }
  }
  throw new Error('Zona no encontrada');
}