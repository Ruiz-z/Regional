import { BugIcon, InfoCircleIcon } from "@/shared/components/icons";
import type { DashboardAlert } from "@/features/dashboard/types";

export function AlertList({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => {
        const isCritical = alert.tone === "danger";
        return (
          <div
            key={alert.id}
            role={isCritical ? "alert" : "status"}
            className={`flex items-center gap-3 rounded-md px-4 py-3 ${
              isCritical
                ? "bg-danger text-on-danger shadow-overlay"
                : "border border-status-info bg-status-info-soft text-status-info"
            }`}
          >
            <span className="flex flex-none">
              {isCritical ? <BugIcon size={24} /> : <InfoCircleIcon size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`m-0 font-bold ${isCritical ? "" : "text-ink"}`}>
                {alert.title}
              </p>
              <p
                className={`m-0 text-[14px] leading-5 ${
                  isCritical ? "opacity-90" : "text-status-info"
                }`}
              >
                {alert.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}