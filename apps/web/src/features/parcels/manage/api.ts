import { apiFetch } from "@/shared/lib/api-client";

export interface ManagedZone { id: string; parcelId: string; name: string; humidityThreshold: number }
export interface ManagedParcel { id: string; ownerId: string; name: string; location: string; crop: string; zones: ManagedZone[] }
export type ParcelInput = Pick<ManagedParcel, "name" | "location" | "crop">;
export type ZoneInput = Pick<ManagedZone, "name" | "humidityThreshold">;
const parcelPath = (id: string) => `/parcels/${encodeURIComponent(id)}`;
const zonePath = (id: string, zoneId?: string) => `${parcelPath(id)}/zones${zoneId ? `/${encodeURIComponent(zoneId)}` : ""}`;

export const managementApi = {
  list: (token: string, signal?: AbortSignal) => apiFetch<ManagedParcel[]>("/parcels", { signal }, token),
  createParcel: (token: string, input: ParcelInput) => apiFetch<ManagedParcel>("/parcels", { method: "POST", body: JSON.stringify(input) }, token),
  updateParcel: (token: string, id: string, input: ParcelInput) => apiFetch<ManagedParcel>(parcelPath(id), { method: "PATCH", body: JSON.stringify(input) }, token),
  deleteParcel: (token: string, id: string) => apiFetch<void>(parcelPath(id), { method: "DELETE" }, token),
  createZone: (token: string, id: string, input: ZoneInput) => apiFetch<ManagedZone>(zonePath(id), { method: "POST", body: JSON.stringify(input) }, token),
  updateZone: (token: string, id: string, zoneId: string, input: ZoneInput) => apiFetch<ManagedZone>(zonePath(id, zoneId), { method: "PATCH", body: JSON.stringify(input) }, token),
  deleteZone: (token: string, id: string, zoneId: string) => apiFetch<void>(zonePath(id, zoneId), { method: "DELETE" }, token),
};
