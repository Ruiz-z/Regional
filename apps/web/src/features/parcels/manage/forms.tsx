"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { ParcelInput, ZoneInput } from "./api";

interface FormProps<T> { initial?: T; busy: boolean; onSave: (value: T) => Promise<boolean>; onCancel: () => void }

export function ParcelForm({ initial, busy, onSave, onCancel }: FormProps<ParcelInput>) {
  const [value, setValue] = useState<ParcelInput>(initial ?? { name: "", location: "", crop: "" });
  const [error, setError] = useState("");
  return <form className="space-y-4 rounded-lg border-2 border-primary bg-surface p-6" onSubmit={async (event) => {
    event.preventDefault();
    const trimmed = { name: value.name.trim(), location: value.location.trim(), crop: value.crop.trim() };
    if (Object.values(trimmed).some((field) => !field)) { setError("Completa todos los campos."); return; }
    setError(""); await onSave(trimmed);
  }}>
    <h2 className="font-bold">{initial ? "Editar parcela" : "Nueva parcela"}</h2>
    <div className="grid gap-4 md:grid-cols-3">{([['name', 'Nombre'], ['location', 'Ubicación'], ['crop', 'Cultivo']] as const).map(([key, label]) => <label className="block space-y-2" key={key}><span>{label}</span><Input required value={value[key]} disabled={busy} onChange={(event) => setValue({ ...value, [key]: event.target.value })} /></label>)}</div>
    {error && <p role="alert" className="text-status-danger">{error}</p>}
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar parcela"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button></div>
  </form>;
}

export function ZoneForm({ initial, busy, onSave, onCancel }: FormProps<ZoneInput>) {
  const [name, setName] = useState(initial?.name ?? "");
  const [threshold, setThreshold] = useState(initial ? String(initial.humidityThreshold) : "45");
  const [error, setError] = useState("");
  return <form className="space-y-4 rounded-lg border border-border-strong bg-surface p-4" onSubmit={async (event) => {
    event.preventDefault();
    const humidityThreshold = Number(threshold);
    if (!name.trim() || !threshold.trim() || !Number.isFinite(humidityThreshold) || humidityThreshold < 0 || humidityThreshold > 100) { setError("Escribe un nombre y un umbral entre 0 y 100%."); return; }
    setError(""); await onSave({ name: name.trim(), humidityThreshold });
  }}>
    <h3 className="font-bold">{initial ? "Editar zona" : "Nueva zona"}</h3>
    <div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span>Nombre de zona</span><Input required value={name} disabled={busy} onChange={(event) => setName(event.target.value)} /></label><label className="block space-y-2"><span>Umbral objetivo (%)</span><Input type="number" min={0} max={100} step="any" required value={threshold} disabled={busy} onChange={(event) => setThreshold(event.target.value)} /></label></div>
    {error && <p role="alert" className="text-status-danger">{error}</p>}
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar zona"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button></div>
  </form>;
}
