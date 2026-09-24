import type { Parcel, Zone, ZonePestState } from "@/shared/types/parcel";

interface ApiZoneStatus {
  latestReading: { humidity: number; temperature: number; createdAt: string } | null;
  pestLevel: ZonePestState;
  lastTreatmentAt: string | null;
}

export type ParcelResponse = Pick<
  Parcel,
  "id" | "ownerId" | "name" | "location" | "crop"
> & {
  zones?: (Pick<Zone, "id" | "parcelId" | "name" | "humidityThreshold"> &
    Partial<ApiZoneStatus>)[];
};

export function mapParcel(p: ParcelResponse): Parcel {
  return {
    ...p,
    areaHa: null,
    zoneCount: p.zones?.length ?? 0,
    lastReadAt:
      p.zones
        ?.map((z) => z.latestReading?.createdAt)
        .filter((v): v is string => !!v)
        .sort()
        .at(-1) ?? null,
    zones: (p.zones ?? []).map((z) => ({
      ...z,
      latestHumidity: z.latestReading?.humidity ?? null,
      latestTemperature: z.latestReading?.temperature ?? null,
      pestState: z.pestLevel ?? "UNKNOWN",
      irrigation: !z.latestReading
        ? "UNKNOWN"
        : z.latestReading.humidity < z.humidityThreshold
          ? "REGANDO"
          : "NORMAL",
      pestDetectionCount: null,
      lastTreatmentAt: z.lastTreatmentAt ?? null,
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
