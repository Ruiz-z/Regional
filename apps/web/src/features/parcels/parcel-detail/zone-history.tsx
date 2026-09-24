import {
  DropletIcon,
  OctagonWarningIcon,
  RefreshIcon,
  TriangleWarningIcon,
} from "@/shared/components/icons";
import type { ZoneHistoryEvent } from "@/features/parcels/types";

const chipTones: Record<string, string> = {
  ok: "bg-status-ok-soft text-status-ok",
  warn: "bg-status-warn-soft text-status-warn",
  danger: "bg-status-danger-soft text-status-danger",
  info: "bg-status-info-soft text-status-info",
  water: "bg-accent-soft text-accent",
};

function historyIcon(tone: ZoneHistoryEvent["tone"]) {
  switch (tone) {
    case "danger":
      return <OctagonWarningIcon size={14} />;
    case "warn":
      return <TriangleWarningIcon size={14} />;
    case "info":
      return <RefreshIcon size={14} />;
    case "water":
      return <DropletIcon size={14} />;
    case "ok":
      return <CircleCheck size={14} />;
  }
}

function CircleCheck({ size }: { size?: number }) {
  return (
    <svg
      width={size ?? 14}
      height={size ?? 14}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ZoneHistory({
  events,
}: {
  events: ZoneHistoryEvent[];
}) {
  return (
    <div className="panel">
      <div className="mb-3 text-[14px] font-bold">Historial de la zona</div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-left">
            {["Fecha", "Evento", "Detalle"].map((heading) => (
              <th
                key={heading}
                className="pb-2.5 text-[12px] font-bold tracking-wide text-ink-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr className="border-t border-border">
              <td colSpan={3} className="py-3 text-[13px] text-ink-muted">
                Sin eventos todavía.
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id} className="border-t border-border">
                <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-[13px] text-ink-muted">
                  {event.time}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-2 font-bold">
                    <span
                      className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ${chipTones[event.tone]}`}
                    >
                      {historyIcon(event.tone)}
                    </span>
                    {event.title}
                  </span>
                </td>
                <td className="py-2.5 text-ink-muted">
                  {event.detail ?? ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}