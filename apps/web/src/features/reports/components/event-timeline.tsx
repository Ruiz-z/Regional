import type { ComponentType } from "react";

import {
  BugIcon,
  CheckIcon,
  OctagonWarningIcon,
  RefreshIcon,
  TriangleWarningIcon,
} from "@/shared/components/icons";
import type { HistoryEvent } from "@/features/reports/types";

const EVENT_ICONS: Record<
  HistoryEvent["kind"],
  ComponentType<{ size?: number }>
> = {
  treatment: CheckIcon,
  pest: OctagonWarningIcon,
  anomaly: TriangleWarningIcon,
  "backup-irrigation": RefreshIcon,
};

const EVENT_TONES: Record<HistoryEvent["kind"], string> = {
  treatment: "bg-status-ok-soft text-status-ok",
  pest: "bg-status-danger-soft text-status-danger",
  anomaly: "bg-status-danger-soft text-status-danger",
  "backup-irrigation": "bg-status-info-soft text-status-info",
};

export function EventTimeline({ events }: { events: HistoryEvent[] }) {
  return (
    <div className="panel">
      <div className="mb-3 text-[14px] font-bold">
        Timeline de intervenciones
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {["Fecha", "Evento", "Detalle"].map((heading) => (
              <th
                key={heading}
                className="px-0 pb-2.5 text-left text-[12px] font-bold uppercase tracking-wide text-ink-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.kind];
            return (
              <tr key={event.id} className="border-t border-border">
                <td className="py-2.5 whitespace-nowrap font-mono text-[13px] text-ink-muted">
                  {event.date}
                </td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-2 font-bold">
                    <span
                      className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ${EVENT_TONES[event.kind]}`}
                    >
                      <Icon size={14} />
                    </span>
                    {event.title}
                  </span>
                </td>
                <td className="py-2.5 text-ink-muted">{event.detail}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}