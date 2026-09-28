"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { CropCatalogEntry, ParcelInput, ZoneInput } from "./api";

interface FormProps<T> { initial?: T; busy: boolean; onSave: (value: T) => Promise<boolean>; onCancel: () => void }

const OTHER_CROP = "__OTRO__";
const selectClassName = "flex h-11 w-full rounded-md border-[1.5px] border-border-strong bg-surface px-3.5 py-3 text-base font-sans text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

export function ParcelForm({ initial, busy, onSave, onCancel, cropCatalog }: FormProps<ParcelInput> & { cropCatalog: CropCatalogEntry[] }) {
  const [value, setValue] = useState<ParcelInput>(initial ?? { name: "", location: "", crop: "" });
  const [error, setError] = useState("");
  const catalogValues = new Set(cropCatalog.map((entry) => entry.value));
  const selectValue = catalogValues.has(value.crop) ? value.crop : OTHER_CROP;
  return <form className="space-y-4 rounded-lg border-2 border-primary bg-surface p-6" onSubmit={async (event) => {
    event.preventDefault();
    const trimmed = { name: value.name.trim(), location: value.location.trim(), crop: value.crop.trim() };
    if (Object.values(trimmed).some((field) => !field)) { setError("Completa todos los campos."); return; }
    setError(""); await onSave(trimmed);
  }}>
    <h2 className="font-bold">{initial ? "Editar parcela" : "Nueva parcela"}</h2>
    <div className="grid gap-4 md:grid-cols-3">
      <label className="block space-y-2"><span>Nombre</span><Input required value={value.name} disabled={busy} onChange={(event) => setValue({ ...value, name: event.target.value })} /></label>
      <label className="block space-y-2"><span>Ubicación</span><Input required value={value.location} disabled={busy} onChange={(event) => setValue({ ...value, location: event.target.value })} /></label>
      <label className="block space-y-2">
        <span>Cultivo</span>
        <select className={selectClassName} disabled={busy} value={selectValue} onChange={(event) => setValue({ ...value, crop: event.target.value === OTHER_CROP ? "" : event.target.value })}>
          {cropCatalog.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
          <option value={OTHER_CROP}>Otro (especificar)</option>
        </select>
        {selectValue === OTHER_CROP && <Input required className="mt-2" placeholder="Nombre del cultivo" value={value.crop} disabled={busy} onChange={(event) => setValue({ ...value, crop: event.target.value })} />}
      </label>
    </div>
    {error && <p role="alert" className="text-status-danger">{error}</p>}
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar parcela"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button></div>
  </form>;
}

export function ZoneForm({ initial, busy, onSave, onCancel, suggestedHumidityThreshold }: FormProps<ZoneInput> & { suggestedHumidityThreshold?: number }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [threshold, setThreshold] = useState(initial ? String(initial.humidityThreshold) : String(suggestedHumidityThreshold ?? 45));
  const [area, setArea] = useState(initial?.areaHectares != null ? String(initial.areaHectares) : "");
  const [error, setError] = useState("");
  return <form className="space-y-4 rounded-lg border border-border-strong bg-surface p-4" onSubmit={async (event) => {
    event.preventDefault();
    const humidityThreshold = Number(threshold);
    if (!name.trim() || !threshold.trim() || !Number.isFinite(humidityThreshold) || humidityThreshold < 0 || humidityThreshold > 100) { setError("Escribe un nombre y un umbral entre 0 y 100%."); return; }
    const areaHectares = area.trim() ? Number(area) : undefined;
    if (areaHectares !== undefined && (!Number.isFinite(areaHectares) || areaHectares < 0)) { setError("La superficie debe ser un número positivo."); return; }
    setError("");
    await onSave({ name: name.trim(), humidityThreshold, ...(areaHectares !== undefined ? { areaHectares } : {}) });
  }}>
    <h3 className="font-bold">{initial ? "Editar zona" : "Nueva zona"}</h3>
    <div className="grid gap-4 md:grid-cols-3">
      <label className="block space-y-2"><span>Nombre de zona</span><Input required value={name} disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
      <label className="block space-y-2"><span>Umbral objetivo (%)</span><Input type="number" min={0} max={100} step="any" required value={threshold} disabled={busy} onChange={(event) => setThreshold(event.target.value)} /></label>
      <label className="block space-y-2"><span>Superficie (ha, opcional)</span><Input type="number" min={0} step="any" value={area} disabled={busy} onChange={(event) => setArea(event.target.value)} /></label>
    </div>
    {error && <p role="alert" className="text-status-danger">{error}</p>}
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar zona"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button></div>
  </form>;
}
