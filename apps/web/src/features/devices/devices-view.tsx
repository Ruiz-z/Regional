"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";
import { Button } from "@/shared/components/ui/button";
import { ToneBadge } from "@/shared/components/ui/tone-badge";
import { Topbar } from "@/shared/components/layout/topbar";

type Device = { id: string; type: "ESP32" | "VISION_SERVICE"; zoneId: string | null; zone?: { id: string; name: string } | null; lastSeenAt: string | null; revokedAt: string | null; online: boolean };
type Parcel = { id: string; name: string; zones: { id: string; name: string }[] };
type KeyResult = { id: string; apiKey: string };
const selectClass = "h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm";

export function DevicesView() {
  const { token } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [zoneError, setZoneError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);
  const [type, setType] = useState<Device["type"]>("ESP32");
  const [zoneId, setZoneId] = useState("");
  const [issuedKey, setIssuedKey] = useState<KeyResult | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    try {
      const data = await apiFetch<Device[]>("/devices", { signal }, token);
      if (!signal?.aborted) { setDevices(data); setListError(""); }
    } catch { if (!signal?.aborted) setListError("No se pudo actualizar la lista de dispositivos."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [token]);
  const loadZones = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    try {
      const data = await apiFetch<Parcel[]>("/parcels", { signal }, token);
      if (!signal?.aborted) { setParcels(data); setZoneError(""); }
    } catch { if (!signal?.aborted) setZoneError("No se pudieron cargar las zonas. Reintenta para asignar un dispositivo."); }
  }, [token]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal); void loadZones(controller.signal);
    const timer = setInterval(() => { if (!mutation.current) void load(controller.signal); }, 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load, loadZones]);
  const zones = parcels.flatMap((parcel) => parcel.zones.map((zone) => ({ ...zone, label: `${parcel.name} · ${zone.name}` })));

  async function mutate(path: string, method: string, body?: object, showKey = false) {
    if (!token || mutation.current) return;
    mutation.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await apiFetch<KeyResult>(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }, token);
      if (showKey) setIssuedKey({ id: result.id, apiKey: result.apiKey });
      setNotice("Dispositivo actualizado correctamente."); setOpen(false);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo completar la operación."); }
    finally { mutation.current = false; setBusy(false); }
  }

  return <>
    <Topbar><h1 className="font-display text-2xl font-bold">Dispositivos IoT</h1><p className="text-sm text-ink-muted">{loading ? "Cargando…" : `${devices.length} dispositivos registrados en toda la plataforma`}</p></Topbar>
    <div className="space-y-6 p-8">
      <div className="flex gap-3"><Button disabled={busy || !!issuedKey} onClick={() => setOpen(true)}>+ Registrar dispositivo</Button><Button variant="secondary" disabled={busy} onClick={() => { void load(); void loadZones(); }}>Actualizar</Button></div>
      {error && <p role="alert" className="text-status-danger">{error}</p>}
      {listError && <p role="alert" className="text-status-danger">{listError}</p>}
      {zoneError && <p role="alert" className="text-status-danger">{zoneError}</p>}
      {notice && <p role="status" className="text-primary">{notice}</p>}
      {issuedKey && <section className="space-y-3 rounded-lg border-2 border-primary bg-surface p-6" aria-label="Nueva API key">
        <h2 className="font-bold">API key del dispositivo {issuedKey.id}</h2>
        <p className="text-sm text-ink-muted">Copia esta clave ahora: no vuelve a mostrarse completa.</p>
        <code className="block break-all rounded-md border border-border bg-surface-sunken p-3">{issuedKey.apiKey}</code>
        <Button variant="secondary" onClick={() => { setIssuedKey(null); setNotice(""); }}>Ya copié la clave</Button>
      </section>}
      {open && <form className="space-y-4 rounded-lg border-2 border-primary bg-surface p-6" onSubmit={(event) => { event.preventDefault(); void mutate("/devices", "POST", { type, zoneId }, true); }}>
        <h2 className="text-lg font-bold">Registrar dispositivo</h2>
        <label className="block space-y-2"><span>Tipo</span><select className={selectClass} value={type} disabled={busy} onChange={(event) => setType(event.target.value as Device["type"])}><option value="ESP32">ESP32</option><option value="VISION_SERVICE">Servicio de visión</option></select></label>
        <label className="block space-y-2"><span>Parcela / zona</span><select className={selectClass} required value={zoneId} disabled={busy || !!zoneError} onChange={(event) => setZoneId(event.target.value)}><option value="">Selecciona una zona</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></label>
        {!zoneError && zones.length === 0 && <p className="text-sm text-ink-muted">Crea una zona en la gestión de parcelas antes de registrar un dispositivo.</p>}
        <div className="flex gap-3"><Button type="submit" disabled={busy || !zoneId || !!zoneError}>{busy ? "Guardando…" : "Registrar y generar clave"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button></div>
      </form>}
      {loading && <p role="status">Cargando dispositivos…</p>}
      {!loading && !listError && devices.length === 0 && <p>No hay dispositivos registrados.</p>}
      {devices.length > 0 && <div className="overflow-x-auto rounded-lg border border-border bg-surface"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-ink-muted"><tr>{["DISPOSITIVO", "PARCELA / ZONA", "ESTADO", "ÚLTIMA LECTURA", "ACCIONES"].map((heading) => <th className="p-4" key={heading}>{heading}</th>)}</tr></thead><tbody>{devices.map((device) => <tr key={device.id} className="border-b border-border last:border-0">
        <td className="p-4"><p className="font-bold">{device.type === "ESP32" ? "ESP32" : "Servicio de visión"}</p><span className="text-xs text-ink-muted">{device.id}</span></td>
        <td className="p-4"><label className="sr-only" htmlFor={`zone-${device.id}`}>Zona del dispositivo {device.id}</label><select id={`zone-${device.id}`} className={selectClass} value={device.zoneId ?? ""} disabled={busy || !!zoneError} onChange={(event) => { void mutate(`/devices/${encodeURIComponent(device.id)}`, "PATCH", { zoneId: event.target.value || null }); }}><option value="">Sin zona asignada</option>{device.zoneId && !zones.some((zone) => zone.id === device.zoneId) && <option value={device.zoneId}>{device.zone?.name ?? device.zoneId}</option>}{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></td>
        <td className="p-4"><ToneBadge tone={device.revokedAt ? "danger" : device.online ? "ok" : "off"}>{device.revokedAt ? "Revocado" : device.online ? "Online" : "Offline"}</ToneBadge></td>
        <td className="p-4 text-ink-muted">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString("es-MX") : "Sin lecturas"}</td>
        <td className="p-4"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={busy || !!issuedKey} onClick={() => { if (window.confirm("La clave anterior dejará de funcionar. ¿Regenerar la API key?")) void mutate(`/devices/${encodeURIComponent(device.id)}/regenerate`, "POST", undefined, true); }}>Regenerar clave</Button><Button size="sm" variant="danger" disabled={busy || !!device.revokedAt} onClick={() => { if (window.confirm("El dispositivo dejará de enviar datos. ¿Revocar su clave?")) void mutate(`/devices/${encodeURIComponent(device.id)}/revoke`, "POST"); }}>Revocar</Button></div></td>
      </tr>)}</tbody></table></div>}
    </div>
  </>;
}
