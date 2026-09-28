import Constants from "expo-constants";
import Notifications, { isExpoGo } from "@/shared/lib/notifications";
import { apiRequest } from "@/shared/lib/api";

// Registra el token push real del dispositivo contra el backend
// (PATCH /notifications/push-token). Best-effort: cualquier fallo (sin
// permisos, sin projectId de EAS todavía, red caída) solo se loguea y
// nunca bloquea el login ni tira la app.
export async function registerPushToken(): Promise<void> {
  if (isExpoGo) {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as
    | string
    | undefined;
  if (!projectId) {
    console.warn(
      "[push] Falta extra.eas.projectId en app.json (correr `eas init`); se omite el registro del token.",
    );
    return;
  }

  try {
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiRequest("/notifications/push-token", {
      method: "PATCH",
      body: { expoPushToken: token.data },
    });
  } catch (err) {
    console.warn(
      "[push] No se pudo registrar el token push:",
      err instanceof Error ? err.message : err,
    );
  }
}
