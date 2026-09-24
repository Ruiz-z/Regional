import type { Metadata } from "next";

import { NotificationsView } from "@/features/notifications/notifications-view";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default function NotificationsPage() {
  return <NotificationsView />;
}