import { cn } from "@/shared/lib/utils";

export function MoistureMeter({
  humidity,
  target,
}: {
  humidity: number;
  target: number;
}) {
  const isLow = humidity < target;
  return (
    <div className="sr-moist flex min-w-0 flex-col gap-1">
      <div className="relative h-[10px] rounded-sm bg-surface-sunken">
        <div
          className={cn(
            "h-full rounded-sm",
            isLow ? "bg-status-warn" : "bg-accent",
          )}
          style={{ width: `${Math.min(100, humidity)}%` }}
        />
        <div
          className="absolute -top-[3px] bottom-[-3px] w-[2px] bg-ink"
          style={{ left: `calc(${target}% - 1px)` }}
        />
      </div>
    </div>
  );
}