import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type { NotificationItem } from "@/features/notifications/types";
import { NOTIFICATIONS_MOCK } from "@/features/notifications/lib/mock-data";
import { isMocksEnabled } from "@/features/dashboard/lib/api";

const NOTIFICATIONS_PATH = "/notifications";
const READ_STORAGE_KEY = "smartriego-notif-read";

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

  try {
    const items = await apiFetch<NotificationItem[]>(
      NOTIFICATIONS_PATH,
      {},
      authToken,
    );
    return mergeReadState(items);
  } catch (error) {
    console.warn(
      "Listado de notificaciones real no disponible (endpoint BE-036 pendiente), usando datos de demostración.",
      error,
    );
    return mergeReadState(NOTIFICATIONS_MOCK);
  }
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

  try {
    await apiFetch(
      `${NOTIFICATIONS_PATH}/${id}/read`,
      { method: "POST" },
      authToken,
    );
  } catch (error) {
    console.warn(
      "No se pudo confirmar la lectura en el servidor; la lectura persiste localmente.",
      error,
    );
  }
}