import {
  DropletIcon,
  OctagonWarningIcon,
  RefreshIcon,
  TriangleWarningIcon,
} from "@/shared/components/icons";
import type { ActivityEvent } from "@/features/dashboard/types";

const chipTones: Record<string, string> = {
  ok: "bg-status-ok-soft text-status-ok",
  warn: "bg-status-warn-soft text-status-warn",
  danger: "bg-status-danger-soft text-status-danger",
  info: "bg-status-info-soft text-status-info",
  water: "bg-accent-soft text-accent",
};

function activityIcon(tone: ActivityEvent["tone"]) {
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
      return <DropletIcon size={14} />;
  }
}

export function ActivityTable({
  activity,
}: {
  activity: ActivityEvent[];
}) {
  return (
    <div>
      <div className="mb-2 text-[14px] font-bold">
        Actividad reciente
      </div>
      <div className="panel overflow-x-auto">
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
            {activity.map((event) => (
              <tr key={event.id} className="border-t border-border">
                <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-[13px] text-ink-muted">
                  {event.time}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-2 font-bold">
                    <span
                      className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ${chipTones[event.tone]}`}
                    >
                      {activityIcon(event.tone)}
                    </span>
                    {event.title}
                  </span>
                </td>
                <td className="py-2.5 text-ink-muted">{event.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}