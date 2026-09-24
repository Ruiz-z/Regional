import * as React from "react";

import { cn } from "@/shared/lib/utils";

export type ToneKind = "ok" | "warn" | "danger" | "info" | "water" | "off";

const toneClasses: Record<ToneKind, string> = {
  ok: "bg-status-ok-soft text-status-ok",
  warn: "bg-status-warn-soft text-status-warn",
  danger: "bg-status-danger-soft text-status-danger",
  info: "bg-status-info-soft text-status-info",
  water: "bg-accent-soft text-accent",
  off: "bg-status-offline-soft text-status-offline",
};

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: ToneKind;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-4",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}