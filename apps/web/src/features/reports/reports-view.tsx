"use client";

import * as React from "react";

import Link from "next/link";

import { AUTH_TOKEN_KEY, useAuth } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import type { ParcelHistoryReport } from "@/features/reports/types";
import { getParcelHistory } from "@/features/reports/lib/api";
import { ReportFilters, type ReportFiltersValue } from "@/features/reports/components/report-filters";
import { ConsumptionChart } from "@/features/reports/components/consumption-chart";
import { EventTimeline } from "@/features/reports/components/event-timeline";

const RECENT_DAYS = 7;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  return { from: isoDate(from), to: isoDate(to) };
}

const INITIAL_FILTERS: ReportFiltersValue = {
  parcelId: "all",
  zoneId: "",
  ...defaultRange(),
};

export function ReportsView() {
  const { token } = useAuth();
  const [filters, setFilters] = React.useState<ReportFiltersValue>(
    INITIAL_FILTERS,
  );
  const [parcels, setParcels] = React.useState<{ id: string; name: string }[]>(
    [],
  );
  const [report, setReport] = React.useState<ParcelHistoryReport | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!authToken) return;
    apiFetch<{ id: string; name: string }[]>("/parcels", {}, authToken)
      .then((result) => {
        if (alive) setParcels(result);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    let alive = true;
    getParcelHistory(
      filters.parcelId,
      filters.from,
      filters.to,
      token ?? undefined,
    )
      .then((result) => {
        if (alive) {
          setReport(result);
        }
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
  }, [token, filters.parcelId, filters.from, filters.to]);

  const visibleEvents =
    report && filters.zoneId
      ? report.events.filter((event) => event.zoneId === filters.zoneId)
      : report?.events ?? [];

  return (
    <>
      <header className="flex-none border-b border-border px-8 pb-5 pt-6">
        <Link
          href="/dashboard"
          className="text-[14px] font-semibold text-accent no-underline"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-ink">
          Histórico y reportes
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-8 pb-12 pt-6">
        <ReportFilters
          parcels={parcels}
          zones={report?.zones ?? []}
          value={filters}
          onChange={setFilters}
        />

        {error ? (
          <p className="text-sm font-semibold text-ink-muted">{error}</p>
        ) : report ? (
          <>
            <div className="flex flex-wrap gap-4">
              <div className="panel min-w-0 flex-1">
                <div className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">
                  Minutos regados (7 días)
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-ink">
                  {report.stats.totalMinutes} min
                </div>
              </div>
              <div className="panel min-w-0 flex-1">
                <div className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">
                  Ahorro estimado vs. tiempo fijo de referencia
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-primary">
                  {report.stats.savingsPercent}%
                </div>
              </div>
              <div className="panel min-w-0 flex-1">
                <div className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">
                  Intervenciones de plaga
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-status-danger">
                  {report.stats.interventions}
                </div>
              </div>
            </div>

            <ConsumptionChart
              chart={report.chart}
              legend={[
                { label: "Minutos regados", tone: "water" },
                { label: "Referencia por zona/cultivo", tone: "target" },
              ]}
            />

            <EventTimeline events={visibleEvents} />
          </>
        ) : (
          <p className="text-sm font-semibold text-ink-muted">
            Cargando histórico…
          </p>
        )}
      </div>
    </>
  );
}