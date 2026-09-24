"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { Button } from "@/shared/components/ui/button";
import { Topbar } from "@/shared/components/layout/topbar";
import { managementApi, type ManagedParcel } from "./api";
import { ParcelForm, ZoneForm } from "./forms";

type Editor = { kind: "parcel"; id?: string } | { kind: "zone"; parcelId: string; id?: string } | null;

export function ManageView() {
  const { token } = useAuth();
  const [parcels, setParcels] = useState<ManagedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);
  const [editor, setEditor] = useState<Editor>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setLoading(true); setLoadError("");
    try { const data = await managementApi.list(token, signal); if (!signal?.aborted) setParcels(data); }
    catch (cause) { if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "No se pudieron cargar las parcelas."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [token]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  async function run(action: () => Promise<void>, message: string) {
    if (!token || mutation.current) return false;
    mutation.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(message); setEditor(null); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar. Intenta nuevamente."); return false; }
    finally { mutation.current = false; setBusy(false); }
  }
  function edit(next: Editor) { setEditor(next); setError(""); setNotice(""); }
  function replaceParcel(parcel: ManagedParcel) { setParcels((previous) => previous.map((item) => item.id === parcel.id ? parcel : item)); }
  const cancel = () => edit(null);
  const disabled = busy || loading;

  return <>
    <Topbar><h1 className="font-display text-2xl font-bold">Mis parcelas y zonas</h1><p className="text-sm text-ink-muted">{loading ? "Cargando…" : `${parcels.length} parcelas · ${parcels.reduce((total, parcel) => total + parcel.zones.length, 0)} zonas`}</p></Topbar>
    <div className="space-y-6 p-8" aria-busy={busy || loading}>
      <div className="flex gap-3"><Button disabled={disabled || editor !== null} onClick={() => edit({ kind: "parcel" })}>+ Nueva parcela</Button><Button variant="secondary" disabled={disabled || editor !== null} onClick={() => void load()}>Actualizar</Button></div>
      {loadError && <p role="alert" className="rounded-md bg-status-danger-soft p-4 text-status-danger">{loadError}</p>}
      {error && <p role="alert" className="rounded-md bg-status-danger-soft p-4 text-status-danger">{error}</p>}
      {notice && <p role="status" className="rounded-md bg-primary-soft p-4 text-primary">{notice}</p>}
      {editor?.kind === "parcel" && !editor.id && <ParcelForm busy={busy} onCancel={cancel} onSave={(input) => run(async () => { const parcel = await managementApi.createParcel(token!, input); setParcels((previous) => [parcel, ...previous]); }, "Parcela creada correctamente.")} />}
      {loading && <p role="status">Cargando parcelas…</p>}
      {!loading && !loadError && parcels.length === 0 && <div className="rounded-lg border border-border bg-surface p-6">Aún no tienes parcelas. Crea una parcela y agrega sus zonas para comenzar.</div>}
      {parcels.map((parcel) => <section key={parcel.id} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">{parcel.name}</h2><p className="text-sm text-ink-muted">{parcel.location} · {parcel.crop}</p></div><div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={disabled || editor !== null} onClick={() => edit({ kind: "parcel", id: parcel.id })}>Editar parcela</Button>
          <Button variant="secondary" size="sm" disabled={disabled || editor !== null} onClick={() => edit({ kind: "zone", parcelId: parcel.id })}>+ Nueva zona</Button>
          <Button variant="danger" size="sm" disabled={disabled || editor !== null} onClick={() => { if (window.confirm(`¿Eliminar ${parcel.name} y todas sus zonas? Los dispositivos quedarán sin asignar.`)) void run(async () => { await managementApi.deleteParcel(token!, parcel.id); setParcels((previous) => previous.filter((item) => item.id !== parcel.id)); }, "Parcela eliminada. Los dispositivos quedaron desvinculados."); }}>Eliminar parcela</Button>
        </div></div>
        {editor?.kind === "parcel" && editor.id === parcel.id && <ParcelForm key={parcel.id} initial={parcel} busy={busy} onCancel={cancel} onSave={(input) => run(async () => { replaceParcel(await managementApi.updateParcel(token!, parcel.id, input)); }, "Parcela actualizada correctamente.")} />}
        {editor?.kind === "zone" && editor.parcelId === parcel.id && !editor.id && <ZoneForm busy={busy} onCancel={cancel} onSave={(input) => run(async () => { const zone = await managementApi.createZone(token!, parcel.id, input); setParcels((previous) => previous.map((item) => item.id === parcel.id ? { ...item, zones: [...item.zones, zone] } : item)); }, "Zona creada correctamente.")} />}
        {parcel.zones.length === 0 ? <p className="py-4 text-sm text-ink-muted">Sin zonas configuradas.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-ink-muted"><tr><th className="py-3 pr-4">ZONA</th><th className="p-3">UMBRAL OBJETIVO</th><th className="p-3">ACCIONES</th></tr></thead><tbody>{parcel.zones.map((zone) => <tr key={zone.id} className="border-b border-border last:border-0"><td className="py-3 pr-4 font-bold">{zone.name}</td><td className="p-3 text-ink-muted">{zone.humidityThreshold}%</td><td className="p-3"><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={disabled || editor !== null} onClick={() => edit({ kind: "zone", parcelId: parcel.id, id: zone.id })}>Editar zona</Button><Button variant="danger" size="sm" disabled={disabled || editor !== null} onClick={() => { if (window.confirm(`¿Eliminar ${zone.name}? Sus dispositivos quedarán sin asignar.`)) void run(async () => { await managementApi.deleteZone(token!, parcel.id, zone.id); setParcels((previous) => previous.map((item) => item.id === parcel.id ? { ...item, zones: item.zones.filter((existing) => existing.id !== zone.id) } : item)); }, "Zona eliminada correctamente."); }}>Eliminar zona</Button></div></td></tr>)}</tbody></table></div>}
        {editor?.kind === "zone" && editor.parcelId === parcel.id && editor.id && <ZoneForm key={editor.id} initial={parcel.zones.find((zone) => zone.id === editor.id)} busy={busy} onCancel={cancel} onSave={(input) => run(async () => { const zone = await managementApi.updateZone(token!, parcel.id, editor.id!, input); setParcels((previous) => previous.map((item) => item.id === parcel.id ? { ...item, zones: item.zones.map((existing) => existing.id === zone.id ? zone : existing) } : item)); }, "Zona actualizada correctamente.")} />}
      </section>)}
    </div>
  </>;
}
