import { api } from "@/shared/lib/api";
import { mapParcel, type ParcelResponse } from "@/shared/lib/parcels";
import type { Parcel, Zone } from "@/shared/types/parcel";
export async function getParcel(id: string): Promise<Parcel> {
  const path = `/parcels/${encodeURIComponent(id)}`;
  const [parcel, zones] = await Promise.all([
    api.get<ParcelResponse>(path),
    api.get<Zone[]>(`${path}/zones`),
  ]);
  return mapParcel({ ...parcel, zones });
}
