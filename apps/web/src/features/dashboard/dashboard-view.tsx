"use client";

import * as React from "react";

import { useAuth } from "@/shared/auth/auth-context";
import { Topbar } from "@/shared/components/layout/topbar";
import { AlertList } from "@/features/dashboard/components/alert-list";
import { HumidityChart } from "@/features/dashboard/components/humidity-chart";
import { ParcelCard } from "@/features/dashboard/components/parcel-card";
import { ParcelSelector } from "@/features/dashboard/components/parcel-selector";
import { PestSummaryPanel } from "@/features/dashboard/components/pest-summary";
import { ActivityTable } from "@/features/dashboard/components/activity-table";
import { WaterConsumptionChart } from "@/features/dashboard/components/consumption-chart";
import { getDashboard } from "@/features/dashboard/lib/api";
import type { DashboardData } from "@/features/dashboard/types";

function greetingFor(hour: number): string {
  if (hour < 12) {
    return "Buenos días";
  }
  if (hour < 20) {
    return "Buenas tardes";
  }
  return "Buenas noches";
}

function firstNameOf(email: string | undefined): string | null {
  if (!email) {
    return null;
  }
  const local = email.split("@")[0];
  const first = local.split(/[._-]+/)[0];
  if (!first) {
    return null;
  }
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function DashboardView() {
  const { token, session } = useAuth();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedParcelId, setSelectedParcelId] =
    React.useState<string>("norte");

  React.useEffect(() => {
    let alive = true;
    getDashboard(token ?? undefined)
      .then((result) => {
        if (alive) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Error inesperado.");
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const name = firstNameOf(session?.email) ?? "Agricultor";
  const greeting = `${greetingFor(new Date().getHours())}, ${name}`;

  if (error) {
    return (
      <>
        <Topbar>
          <h1 className="m-0 font-display text-2xl font-bold text-ink">
            {greeting}
          </h1>
        </Topbar>
        <div className="flex flex-1 items-center justify-center px-8">
          <p className="text-sm font-semibold text-ink-muted">{error}</p>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Topbar>
          <h1 className="m-0 font-display text-2xl font-bold text-ink">
            {greeting}
          </h1>
        </Topbar>
        <div className="flex flex-1 flex-col gap-6 px-8 pb-12 pt-6">
          <p className="mt-6 text-center text-sm font-semibold text-ink-muted">
            Cargando resumen…
          </p>
        </div>
      </>
    );
  }

  const visibleAlerts =
    selectedParcelId === "todas"
      ? data.alerts
      : data.alerts.filter((alert) => alert.parcelId === selectedParcelId);
  const visibleParcels =
    selectedParcelId === "todas"
      ? data.parcels
      : data.parcels.filter((parcel) => parcel.id === selectedParcelId);

  return (
    <>
      <Topbar>
        <h1 className="m-0 font-display text-2xl font-bold text-ink">
          {greeting}
        </h1>
        <ParcelSelector
          options={data.parcels.map((parcel) => ({
            id: parcel.id,
            name: parcel.name,
          }))}
          value={selectedParcelId}
          onChange={setSelectedParcelId}
        />
      </Topbar>

      <div className="flex flex-1 flex-col gap-6 px-8 pb-12 pt-6">
        <AlertList alerts={visibleAlerts} />
        <HumidityChart
          legend={data.humidityLegend}
          series={data.humiditySeries}
          labels={data.humidityLabels}
        />
        <div className="flex gap-5">
          <div className="min-w-0 flex-1">
            <WaterConsumptionChart days={data.consumption} />
          </div>
          <PestSummaryPanel summary={data.pestSummary} />
        </div>
        {visibleParcels.map((parcel) => (
          <section key={parcel.id}>
            <h2 className="mb-2 mt-0 font-display text-lg font-bold text-ink">
              {parcel.name}
            </h2>
            <ParcelCard parcel={parcel} />
          </section>
        ))}
        <ActivityTable activity={data.activity} />
      </div>
    </>
  );
}