"use client";

import * as React from "react";

import { useAuth } from "@/shared/auth/auth-context";
import { Topbar } from "@/shared/components/layout/topbar";
import { ParcelCard } from "@/features/dashboard/components/parcel-card";
import { getDashboard } from "@/features/dashboard/lib/api";
import type { DashboardData } from "@/features/dashboard/types";

export function ParcelListView() {
  const { token, session } = useAuth();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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

  if (error) {
    return (
      <>
        <Topbar>
          <h1 className="m-0 font-display text-2xl font-bold text-ink">
            Mis parcelas
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
            Mis parcelas
          </h1>
        </Topbar>
        <div className="flex flex-1 items-center justify-center px-8">
          <p className="text-sm font-semibold text-ink-muted">
            Cargando parcelas…
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar>
        <h1 className="m-0 font-display text-2xl font-bold text-ink">
          Mis parcelas
        </h1>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          {session?.email ?? ""}
        </p>
      </Topbar>
      <div className="flex flex-1 flex-col gap-6 px-8 pb-12 pt-6">
        {data.parcels.map((parcel) => (
          <section key={parcel.id}>
            <h2 className="mb-2 mt-0 font-display text-lg font-bold text-ink">
              {parcel.name}
            </h2>
            <ParcelCard parcel={parcel} />
          </section>
        ))}
      </div>
    </>
  );
}