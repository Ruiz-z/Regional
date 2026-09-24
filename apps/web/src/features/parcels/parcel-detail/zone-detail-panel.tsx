import {
  CircleSolidIcon,
  OctagonWarningIcon,
  TriangleWarningIcon,
} from "@/shared/components/icons";
import { Button } from "@/shared/components/ui/button";
import { ToneBadge } from "@/shared/components/ui/tone-badge";
import type { ZoneDetail } from "@/features/parcels/types";
import { MoistureMeter } from "@/features/parcels/parcel-detail/moisture-meter";

function pestIcon(tone: ZoneDetail["pest"]["tone"]) {
  switch (tone) {
    case "ok":
      return <CircleSolidIcon size={16} />;
    case "warn":
      return <TriangleWarningIcon size={16} />;
    case "danger":
      return <OctagonWarningIcon size={16} />;
    default:
      return null;
  }
}

function zoneBorder(zone: ZoneDetail, treated: boolean): string {
  if (treated) {
    return "border border-border";
  }
  switch (zone.cell.tone) {
    case "danger":
      return "border-2 border-status-danger";
    case "warn":
      return "border border-status-warn";
    case "info":
      return "border border-status-info";
    case "water":
      return "border border-accent";
    default:
      return "border border-border";
  }
}

export function ZoneDetailPanel({
  zone,
  canTreat,
  treating,
  treated,
  actionError,
  onActivate,
}: {
  zone: ZoneDetail;
  canTreat: boolean;
  treating: boolean;
  treated: boolean;
  actionError: string | null;
  onActivate: () => void;
}) {
  const inServerCooldown = zone.cooldownUntil !== null;
  const humidity = zone.cell.humidityPct;

  return (
    <div
      className={`panel flex flex-col gap-3.5 ${zoneBorder(zone, treated)}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[17px] font-bold">Zona {zone.cell.name}</div>
        <div className="text-[13px] text-ink-muted">{zone.size}</div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[32px] font-bold leading-none">
          {humidity === null ? "—" : `${humidity}%`}
        </span>
        <span className="text-[13px] text-ink-muted">
          / objetivo {zone.targetPct}%
        </span>
      </div>

      {humidity === null ? (
        <p className="m-0 text-[13px] text-ink-muted">
          Sin lecturas del sensor en esta zona.
        </p>
      ) : (
        <MoistureMeter humidity={humidity} target={zone.targetPct} />
      )}

      <div className="flex items-baseline gap-1.5 text-[14px]">
        <span className="font-bold text-ink-muted">Temp.</span>
        <span className="font-mono font-bold">
          {zone.temperatureC === null ? "—" : `${zone.temperatureC} °C`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <ToneBadge tone={zone.irrigation.tone}>{zone.irrigation.label}</ToneBadge>
        <ToneBadge tone={zone.pest.tone}>
          {pestIcon(zone.pest.tone)}
          {zone.pest.label}
          {zone.pest.detections !== undefined
            ? ` · ${zone.pest.detections}`
            : null}
        </ToneBadge>
      </div>

      {canTreat ? (
        <div className="mt-auto flex flex-col gap-1.5">
          {actionError ? (
            <p className="m-0 text-[13px] font-semibold text-status-danger">
              {actionError}
            </p>
          ) : null}

          {treated ? (
            <div className="inline-flex items-center gap-2 text-[14px] font-bold text-status-ok">
              <svg
                width="18"
                height="18"
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
              Tratamiento activado · cooldown 10 min
            </div>
          ) : (
            <Button
              variant="danger"
              size="lg"
              disabled={
                zone.pestState === "NORMAL" || inServerCooldown
              }
              onClick={onActivate}
              className="justify-center"
            >
              {treating ? "Activando…" : "Activar tratamiento"}
            </Button>
          )}

          {zone.pestState === "NORMAL" ? (
            <p className="m-0 text-[12px] text-ink-muted">
              El tratamiento manual se habilita solo cuando la zona está en
              Monitoreo o Intervención.
            </p>
          ) : null}

          {inServerCooldown && zone.pestState !== "NORMAL" ? (
            <p className="m-0 text-[12px] text-ink-muted">
              En cooldown: el tratamiento manual se puede reutilizar cada 10
              minutos.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}