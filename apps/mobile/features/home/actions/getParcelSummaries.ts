import { api } from "@/shared/lib/api";
import {
  mapParcel,
  aggregateState,
  type ParcelResponse,
} from "@/shared/lib/parcels";
import type { ParcelSummary } from "@/shared/types/parcel";
export async function getParcelSummaries(): Promise<ParcelSummary[]> {
  const parcels = await api.get<ParcelResponse[]>("/parcels");
  return parcels.map((raw) => {
    const p = mapParcel(raw);
    return {
      ...p,
      aggregate: aggregateState(p.zones),
      alertZoneName:
        p.zones.find((z) => z.pestState === "INTERVENCION")?.name ?? null,
    };
  });
}
