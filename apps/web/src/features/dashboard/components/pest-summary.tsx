import {
  CircleSolidIcon,
  OctagonWarningIcon,
  TriangleWarningIcon,
} from "@/shared/components/icons";
import { ToneBadge, type ToneKind } from "@/shared/components/ui/tone-badge";
import type { PestSummary } from "@/features/dashboard/types";

export function PestSummaryPanel({ summary }: { summary: PestSummary }) {
  const rows: { tone: ToneKind; label: string; icon: React.ReactNode; count: number }[] = [
    {
      tone: "ok",
      label: "Normal",
      icon: <CircleSolidIcon size={16} />,
      count: summary.normal,
    },
    {
      tone: "warn",
      label: "Monitoreo",
      icon: <TriangleWarningIcon size={16} />,
      count: summary.monitoreo,
    },
    {
      tone: "danger",
      label: "Intervención",
      icon: <OctagonWarningIcon size={16} />,
      count: summary.intervencion,
    },
  ];
  return (
    <div className="panel flex w-[280px] flex-none flex-col gap-3">
      <div className="text-[14px] font-bold">Estado de plagas por zona</div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between"
          >
            <ToneBadge tone={row.tone}>
              {row.icon}
              {row.label}
            </ToneBadge>
            <span className="font-bold">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}