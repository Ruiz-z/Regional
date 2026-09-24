import { Topbar } from "@/shared/components/layout/topbar";

export function ConfigView() {
  return <>
    <Topbar><h1 className="font-display text-2xl font-bold">Configuración global</h1><p className="text-sm text-ink-muted">Umbrales e integraciones de la plataforma</p></Topbar>
    <div className="grid gap-6 p-8 lg:grid-cols-2">
      <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">Umbrales de operación</h2>
        <p className="text-sm text-ink-muted">El riego se decide automáticamente para cada zona. Puedes editar su umbral de humedad en la gestión de parcelas y zonas.</p>
        <a className="inline-block font-semibold text-primary underline" href="/parcels/manage">Gestionar umbrales por zona</a>
        <p role="status" className="rounded-md bg-surface-sunken p-3 text-sm">La edición de umbrales globales aún no está disponible.</p>
      </section>
      <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">Integraciones</h2>
        <dl className="space-y-4 text-sm"><div><dt className="font-bold">OpenWeather</dt><dd className="text-ink-muted">Pronóstico meteorológico para las decisiones de riego.</dd></div><div><dt className="font-bold">Notificaciones push y correo</dt><dd className="text-ink-muted">Avisos sobre eventos de tus zonas.</dd></div></dl>
        <p role="status" className="rounded-md bg-surface-sunken p-3 text-sm">La consulta de estado y la configuración de estas integraciones aún no están disponibles.</p>
      </section>
    </div>
  </>;
}
