import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type { NotificationItem } from "@/features/notifications/types";
import { NOTIFICATIONS_MOCK } from "@/features/notifications/lib/mock-data";
import { isMocksEnabled } from "@/features/dashboard/lib/api";

const NOTIFICATIONS_PATH = "/notifications";
const READ_STORAGE_KEY = "smartriego-notif-read";

// --- Formas reales de la API ---

type ApiNotificationType = "RAIN_CORRECTION" | "IRRIGATION_ANOMALY" | "PEST_ALERT";

interface ApiNotification {
  id: string;
  zoneId: string | null;
  type: ApiNotificationType;
  severity: "INFO" | "CRITICAL";
  read: boolean;
  createdAt: string;
}

interface ApiZone {
  id: string;
  name: string;
}

interface ApiParcel {
  id: string;
  name: string;
  zones: ApiZone[];
}

const TYPE_TITLE: Record<ApiNotificationType, string> = {
  RAIN_CORRECTION: "Corrección por lluvia insuficiente",
  IRRIGATION_ANOMALY: "Anomalía de riego",
  PEST_ALERT: "Foco de plaga confirmado",
};

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

function findParcelAndZone(
  parcels: ApiParcel[],
  zoneId: string | null,
): { parcel: ApiParcel; zone: ApiZone } | null {
  if (!zoneId) return null;
  for (const parcel of parcels) {
    const zone = parcel.zones.find((z) => z.id === zoneId);
    if (zone) return { parcel, zone };
  }
  return null;
}

function toNotificationItem(
  notification: ApiNotification,
  parcels: ApiParcel[],
): NotificationItem {
  const match = findParcelAndZone(parcels, notification.zoneId);
  return {
    id: notification.id,
    severity: notification.severity === "CRITICAL" ? "CRITICA" : "INFORMATIVA",
    read: notification.read,
    title: match
      ? `${TYPE_TITLE[notification.type]} · Zona ${match.zone.name}`
      : TYPE_TITLE[notification.type],
    meta: `${match ? match.parcel.name : "Sin parcela"} · ${timeAgo(notification.createdAt)}`,
    parcelId: match?.parcel.id ?? "",
  };
}

function loadReadIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function persistReadId(id: string): void {
  const ids = new Set(loadReadIds());
  ids.add(id);
  try {
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // almacenamiento no disponible
  }
}

function mergeReadState(items: NotificationItem[]): NotificationItem[] {
  const readIds = new Set(loadReadIds());
  return items.map((item) => ({
    ...item,
    read: item.read || readIds.has(item.id),
  }));
}

export async function getNotifications(
  token?: string,
): Promise<NotificationItem[]> {
  if (isMocksEnabled()) {
    return mergeReadState(NOTIFICATIONS_MOCK);
  }

  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }

  const [notifications, parcels] = await Promise.all([
    apiFetch<ApiNotification[]>(NOTIFICATIONS_PATH, {}, authToken),
    apiFetch<ApiParcel[]>("/parcels", {}, authToken).catch(() => []),
  ]);
  return mergeReadState(
    notifications.map((n) => toNotificationItem(n, parcels)),
  );
}

export async function markNotificationRead(
  id: string,
  token?: string,
): Promise<void> {
  persistReadId(id);
  if (isMocksEnabled()) {
    return;
  }

  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    return;
  }

  await apiFetch(
    `${NOTIFICATIONS_PATH}/${id}/read`,
    { method: "PATCH" },
    authToken,
  );
}
