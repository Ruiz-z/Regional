import Link from "next/link";

import { ToneBadge } from "@/shared/components/ui/tone-badge";
import { ZoneCell } from "@/features/zones/components/zone-cell";
import type { ParcelSummary } from "@/features/dashboard/types";

export function ParcelCard({ parcel }: { parcel: ParcelSummary }) {
  return (
    <Link
      href={`/parcels/${parcel.id}`}
      className={`block rounded-lg bg-surface p-4 no-underline shadow-card transition-shadow hover:shadow-overlay ${
        parcel.alertBorder ? "border-2 border-status-danger" : "border border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[16px] font-bold text-ink">
            {parcel.name}
          </div>
          <div className="mt-0.5 text-[13px] text-ink-muted">
            {parcel.crop} · {parcel.area} · {parcel.zonesCount} zonas
          </div>
        </div>
        {parcel.badge ? (
          <ToneBadge tone={parcel.badge.tone}>{parcel.badge.label}</ToneBadge>
        ) : null}
      </div>
      <div
        className="mt-3 grid gap-2 rounded-lg border border-border bg-surface-sunken p-2"
        style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
      >
        {parcel.zones.map((zone) => (
          <ZoneCell key={zone.id} zone={zone} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[13px] text-ink-muted">
        <span>Última lectura · {parcel.lastReading}</span>
        <span className="font-semibold text-accent">Ver parcela →</span>
      </div>
    </Link>
  );
}