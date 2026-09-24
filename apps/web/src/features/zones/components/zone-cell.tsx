import {
  CircleSolidIcon,
  DropletIcon,
  OfflineIcon,
  OctagonWarningIcon,
  RefreshIcon,
  TriangleWarningIcon,
} from "@/shared/components/icons";

export type ZoneTone = "ok" | "warn" | "danger" | "info" | "water" | "off";

export interface ZoneSnapshot {
  id: string;
  name: string;
  humidityPct: number | null;
  statusLabel: string;
  tone: ZoneTone;
  selected?: boolean;
}

const cellToneClasses: Record<ZoneTone, { cell: string; icon: string }> = {
  ok: { cell: "border-status-ok bg-status-ok-soft", icon: "text-status-ok" },
  warn: {
    cell: "border-status-warn bg-status-warn-soft",
    icon: "text-status-warn",
  },
  danger: {
    cell: "border-status-danger bg-status-danger-soft",
    icon: "text-status-danger",
  },
  info: {
    cell: "border-status-info bg-status-info-soft",
    icon: "text-status-info",
  },
  water: { cell: "border-accent bg-accent-soft", icon: "text-accent" },
  off: {
    cell: "border-dashed border-status-offline bg-status-offline-soft",
    icon: "text-status-offline",
  },
};

export function statusIconFor(tone: ZoneTone, size = 18) {
  switch (tone) {
    case "water":
      return <DropletIcon size={size} />;
    case "info":
      return <RefreshIcon size={size} />;
    case "ok":
      return <CircleSolidIcon size={size} />;
    case "danger":
      return <OctagonWarningIcon size={size} />;
    case "warn":
      return <TriangleWarningIcon size={size} />;
    case "off":
      return <OfflineIcon size={size} />;
  }
}

export function ZoneCell({
  zone,
  onClick,
}: {
  zone: ZoneSnapshot;
  onClick?: (zone: ZoneSnapshot) => void;
}) {
  const tone = cellToneClasses[zone.tone];
  const clickable = onClick !== undefined;
  return (
    <div
      role="button"
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onClick(zone) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                onClick(zone);
              }
            }
          : undefined
      }
      className={`flex min-h-[84px] flex-col justify-between gap-1 rounded-md border p-2 bg-surface text-ink ${
        zone.tone === "danger" ? "border-2" : "border"
      } ${tone.cell} ${clickable ? "cursor-pointer" : ""}`}
      style={{
        boxShadow: zone.selected ? "0 0 0 3px var(--primary)" : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[14px] font-bold leading-5">{zone.name}</span>
        <span className={`flex ${tone.icon}`}>{statusIconFor(zone.tone)}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="font-mono text-[18px] font-bold leading-6">
          {zone.humidityPct === null ? "—" : `${zone.humidityPct}%`}
        </div>
        <div className="text-[13px] leading-[18px] text-ink-muted">
          {zone.statusLabel}
        </div>
      </div>
    </div>
  );
}