export interface ReportFiltersValue {
  parcelId: string;
  zoneId: string;
  from: string;
  to: string;
}

const FIELD_CLASS =
  "flex h-10 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-sans text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ReportFilters({
  parcels,
  zones,
  value,
  onChange,
}: {
  parcels: { id: string; name: string }[];
  zones: string[];
  value: ReportFiltersValue;
  onChange: (next: ReportFiltersValue) => void;
}) {
  const set = (patch: Partial<ReportFiltersValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <select
        className={FIELD_CLASS}
        aria-label="Filtrar por parcela"
        value={value.parcelId}
        onChange={(event) => set({ parcelId: event.target.value, zoneId: "" })}
      >
        <option value="all">Todas mis parcelas</option>
        {parcels.map((parcel) => (
          <option key={parcel.id} value={parcel.id}>
            {parcel.name}
          </option>
        ))}
      </select>
      <select
        className={FIELD_CLASS}
        aria-label="Filtrar por zona"
        value={value.zoneId}
        onChange={(event) => set({ zoneId: event.target.value })}
      >
        <option value="">Zona: todas</option>
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      <input
        className={`${FIELD_CLASS} w-auto`}
        type="date"
        aria-label="Desde"
        value={value.from}
        onChange={(event) => set({ from: event.target.value })}
      />
      <span className="text-[13px] text-ink-muted">–</span>
      <input
        className={`${FIELD_CLASS} w-auto`}
        type="date"
        aria-label="Hasta"
        value={value.to}
        onChange={(event) => set({ to: event.target.value })}
      />
    </div>
  );
}