import type { Parcel, Zone, ZonePestState } from "@/shared/types/parcel";
export type ParcelResponse = Pick<
  Parcel,
  "id" | "ownerId" | "name" | "location" | "crop"
> & {
  zones?: Array<Pick<Zone, "id" | "parcelId" | "name" | "humidityThreshold">>;
};
export function mapParcel(p: ParcelResponse): Parcel {
  return {
    ...p,
    areaHa: null,
    zoneCount: p.zones?.length ?? 0,
    lastReadAt: null,
    zones: (p.zones ?? []).map((z) => ({
      ...z,
      latestHumidity: null,
      latestTemperature: null,
      pestState: "UNKNOWN",
      irrigation: "UNKNOWN",
      pestDetectionCount: null,
      lastTreatmentAt: null,
    })),
  };
}
export function aggregateState(zones: Zone[]): ZonePestState {
  if (zones.some((z) => z.pestState === "INTERVENCION")) return "INTERVENCION";
  if (zones.some((z) => z.pestState === "MONITOREO")) return "MONITOREO";
  return zones.length && zones.every((z) => z.pestState === "NORMAL")
    ? "NORMAL"
    : "UNKNOWN";
}
