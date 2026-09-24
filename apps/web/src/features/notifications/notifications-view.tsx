"use client";

import * as React from "react";

import Link from "next/link";

import { useAuth } from "@/shared/auth/auth-context";
import type { NotificationItem } from "@/features/notifications/types";
import {
  getNotifications,
  markNotificationRead,
} from "@/features/notifications/lib/api";
import { NotificationList } from "@/features/notifications/components/notification-list";

export function NotificationsView() {
  const { token } = useAuth();
  const [notifications, setNotifications] = React.useState<
    NotificationItem[] | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    getNotifications(token ?? undefined)
      .then((result) => {
        if (alive) {
          setNotifications(result);
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(
            err instanceof Error ? err.message : "Error inesperado.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const criticalUnread =
    notifications?.filter(
      (item) => item.severity === "CRITICA" && !item.read,
    ).length ?? 0;
  const informative =
    notifications?.filter((item) => item.severity === "INFORMATIVA")
      .length ??
    0;
  const subtitle = [
    `${criticalUnread} ${criticalUnread === 1 ? "crítica" : "críticas"} sin atender`,
    `${informative} ${informative === 1 ? "informativa" : "informativas"}`,
  ].join(" · ");

  const handleOpen = (notification: NotificationItem) => {
    if (notification.read) {
      return;
    }
    setNotifications((current) =>
      current
        ? current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          )
        : current,
    );
    void markNotificationRead(notification.id, token ?? undefined);
  };

  return (
    <>
      <header className="flex-none border-b border-border px-8 pb-5 pt-6">
        <Link
          href="/dashboard"
          className="text-[14px] font-semibold text-accent no-underline"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-ink">
          Notificaciones
        </h1>
        <p className="mt-0.5 text-[14px] text-ink-muted">{subtitle}</p>
      </header>

      <div className="flex flex-1 flex-col px-8 pb-12 pt-6">
        {error ? (
          <p className="text-sm font-semibold text-ink-muted">{error}</p>
        ) : notifications ? (
          <NotificationList
            notifications={notifications}
            onOpen={handleOpen}
          />
        ) : (
          <p className="text-sm font-semibold text-ink-muted">
            Cargando notificaciones…
          </p>
        )}
      </div>
    </>
  );
}