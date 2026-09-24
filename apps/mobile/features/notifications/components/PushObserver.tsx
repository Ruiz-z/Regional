import { useEffect, useRef } from "react";
import { router, useRootNavigationState } from "expo-router";
import Notifications from "@/shared/lib/notifications";
import { useAuth } from "@/shared/contexts/AuthContext";
import { notificationRoute } from "@/features/notifications/lib/notificationRoute";
export function PushObserver() {
  const { session } = useAuth();
  const navigation = useRootNavigationState();
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!navigation?.key || session?.role !== "AGRICULTOR" || !response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    const route = notificationRoute(
      response.notification.request.content.data ?? {},
    );
    handled.current = id;
    if (route) router.push(route);
  }, [response, session, navigation?.key]);
  return null;
}
