"use client";

import * as React from "react";

import Link from "next/link";

import { useAuth } from "@/shared/auth/auth-context";
import { ToneBadge } from "@/shared/components/ui/tone-badge";
import { ZoneCell, type ZoneSnapshot } from "@/features/zones/components/zone-cell";
import { ParcelDetail, ZoneDetail } from "@/features/parcels/types";
import {
  activateZoneTreatment,
  getParcelDetail,
} from "@/features/parcels/lib/api";
import { ZoneDetailPanel } from "@/features/parcels/parcel-detail/zone-detail-panel";
import { ZoneHistory } from "@/features/parcels/parcel-detail/zone-history";

export function ParcelDetailView({ parcelId }: { parcelId: string }) {
  const { token, session } = useAuth();
  const [parcel, setParcel] = React.useState<ParcelDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = React.useState<string | null>(
    null,
  );
  const [treated, setTreated] = React.useState<Record<string, boolean>>({});
  const [treating, setTreating] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    getParcelDetail(parcelId, token ?? undefined)
      .then((result) => {
        if (!alive) {
          return;
        }
        setParcel(result);
        const initial =
          result.zones.find((zone) => zone.cell.selected) ??
          result.zones[0];
        setSelectedZoneId(initial?.id ?? null);
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(
            err instanceof Error ? err.message : "Error inesperado.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [parcelId, token]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-8">
        <p className="text-sm font-semibold text-ink-muted">{error}</p>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex flex-1 items-center justify-center px-8">
        <p className="text-sm font-semibold text-ink-muted">
          Cargando detalle de parcela…
        </p>
      </div>
    );
  }

  const selectedZone =
    parcel.zones.find((zone) => zone.id === selectedZoneId) ??
    parcel.zones[0];

  const isOwner =
    session?.role === "AGRICULTOR" && parcel.ownerId === session.userId;

  const handleSelectZone = (cell: ZoneSnapshot) => {
    setSelectedZoneId(cell.id);
  };

  const handleActivate = async (zone: ZoneDetail) => {
    if (!token || treating) {
      return;
    }
    setActionError(null);
    setTreating(zone.id);
    try {
      await activateZoneTreatment(zone.id, token);
      setTreated((prev) => ({ ...prev, [zone.id]: true }));
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo activar el tratamiento.",
      );
    } finally {
      setTreating(null);
    }
  };

  return (
    <>
      <header className="flex-none border-b border-border px-8 pb-5 pt-6">
        <Link
          href="/dashboard"
          className="text-[14px] font-semibold text-accent no-underline"
        >
          ← Volver al dashboard
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <div>
            <h1 className="m-0 font-display text-2xl font-bold text-ink">
              {parcel.name}
            </h1>
            <p className="m-0 mt-0.5 text-[14px] text-ink-muted">
              {parcel.crop} · {parcel.area} · {parcel.zonesCount} zonas
            </p>
          </div>
          {parcel.badge ? (
            <ToneBadge tone={parcel.badge.tone}>
              {parcel.badge.label}
            </ToneBadge>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 flex-row items-start gap-6 px-8 pb-12 pt-6">
        <div className="panel min-w-0 flex-1">
          <div className="mb-3.5 text-[14px] font-bold">Plano de la parcela</div>
          <div
            className="grid gap-2 rounded-lg border border-border bg-surface-sunken p-2"
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            {parcel.zones.map((zone) => (
              <ZoneCell
                key={zone.id}
                zone={{
                  ...zone.cell,
                  selected: zone.id === selectedZoneId,
                }}
                onClick={handleSelectZone}
              />
            ))}
          </div>
        </div>

        <div className="flex w-[380px] flex-none flex-col gap-4">
          {selectedZone ? (
            <ZoneDetailPanel
              zone={selectedZone}
              canTreat={isOwner}
              treating={treating === selectedZone.id}
              treated={treated[selectedZone.id] === true}
              actionError={actionError}
              onActivate={() => handleActivate(selectedZone)}
            />
          ) : null}
          {selectedZone ? <ZoneHistory events={selectedZone.history} /> : null}
        </div>
      </div>
    </>
  );
}