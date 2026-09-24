"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { apiFetch, ApiError } from "@/shared/lib/api-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Topbar } from "@/shared/components/layout/topbar";

type Farmer = { id: string; email: string; role: "AGRICULTOR" | "ADMIN"; createdAt?: string };

export function UsersView() {
  const { token } = useAuth();
  const [users, setUsers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setLoading(true);
    setListError("");
    try {
      const data = await apiFetch<Farmer[]>("/users", { signal }, token);
      if (!signal?.aborted) setUsers(data.filter((user) => user.role === "AGRICULTOR"));
    } catch (cause) {
      if (!signal?.aborted) setListError(cause instanceof ApiError && cause.status === 404
        ? "El listado de agricultores aún no está disponible. Puedes dar de alta una cuenta."
        : "No se pudo cargar el listado de agricultores.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [token]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const user = await apiFetch<Farmer>("/users", { method: "POST", body: JSON.stringify({ email: email.trim(), password, role: "AGRICULTOR" }) }, token);
      setUsers((previous) => [user, ...previous.filter((item) => item.id !== user.id)]);
      setNotice(`Cuenta de ${user.email} creada correctamente.`);
      setPassword(""); setEmail(""); setOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear la cuenta."); }
    finally { setBusy(false); }
  }

  return <>
    <Topbar><h1 className="font-display text-2xl font-bold">Gestión de usuarios</h1><p className="text-sm text-ink-muted">Alta de cuentas de Agricultor</p></Topbar>
    <div className="space-y-6 p-8">
      <Button onClick={() => { setOpen(true); setError(""); }}>+ Nuevo Agricultor</Button>
      {notice && <p role="status" className="rounded-md bg-primary-soft p-4 text-primary">{notice}</p>}
      {open && <form onSubmit={create} className="space-y-4 rounded-lg border-2 border-primary bg-surface p-6">
        <h2 className="text-lg font-bold">Nuevo Agricultor</h2>
        <label className="block space-y-2"><span>Correo electrónico</span><Input type="email" autoComplete="off" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} /></label>
        <label className="block space-y-2"><span>Contraseña inicial</span><Input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} /><span className="text-xs text-ink-muted">Mínimo 8 caracteres.</span></label>
        {error && <p role="alert" className="text-status-danger">{error}</p>}
        <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Creando…" : "Crear cuenta"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => { setOpen(false); setPassword(""); }}>Cancelar</Button></div>
      </form>}
      {loading && <p role="status">Cargando agricultores…</p>}
      {listError && <div role="alert" className="rounded-lg border border-border bg-surface p-4"><p>{listError}</p><Button variant="ghost" onClick={() => void load()}>Reintentar</Button></div>}
      {!loading && !listError && users.length === 0 && <p>No hay agricultores registrados.</p>}
      {users.length > 0 && <div className="overflow-x-auto rounded-lg border border-border bg-surface"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-bold">{listError ? "Cuentas creadas en esta sesión" : `${users.length} Agricultores dados de alta`}</caption><thead className="border-y border-border text-xs text-ink-muted"><tr><th className="p-4">CORREO</th><th className="p-4">ROL</th><th className="p-4">FECHA DE ALTA</th></tr></thead><tbody>{users.map((user) => <tr className="border-b border-border last:border-0" key={user.id}><td className="p-4 font-semibold">{user.email}</td><td className="p-4">Agricultor</td><td className="p-4 text-ink-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-MX") : "—"}</td></tr>)}</tbody></table></div>}
    </div>
  </>;
}
