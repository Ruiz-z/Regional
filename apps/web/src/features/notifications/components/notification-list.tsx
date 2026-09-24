import * as React from "react";

import Link from "next/link";

import {
  BugIcon,
  InfoCircleIcon,
} from "@/shared/components/icons";
import type { NotificationItem } from "@/features/notifications/types";

interface NotificationListProps {
  notifications: NotificationItem[];
  onOpen: (notification: NotificationItem) => void;
}

export function NotificationList({
  notifications,
  onOpen,
}: NotificationListProps) {
  return (
    <div className="panel overflow-hidden p-0">
      {notifications.map((notification) => {
        const isCritical = notification.severity === "CRITICA";
        const active = isCritical && !notification.read;
        return (
          <Link
            key={notification.id}
            href={`/parcels/${notification.parcelId}`}
            onClick={() => onOpen(notification)}
            className={`flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0 no-underline transition-colors hover:bg-surface-sunken ${
              active ? "bg-primary-soft" : ""
            }`}
          >
            <span
              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                isCritical && !notification.read
                  ? "bg-primary"
                  : "bg-transparent"
              }`}
              aria-hidden="true"
            />
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isCritical
                  ? "text-status-danger bg-status-danger-soft"
                  : "text-status-info bg-status-info-soft"
              }`}
            >
              {isCritical ? (
                <BugIcon size={17} />
              ) : (
                <InfoCircleIcon size={17} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[14px] font-bold ${
                  active ? "text-ink" : "text-ink-muted"
                }`}
              >
                {notification.title}
              </span>
              <span className="block text-[13px] text-ink-muted">
                {notification.meta}
              </span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              aria-hidden="true"
              className={`mt-3 shrink-0 ${
                active ? "text-ink" : "text-ink-muted"
              }`}
            >
              <path
                d="M4.5 6 8 9.5 11.5 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="rotate(-90 8 8)"
              />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}