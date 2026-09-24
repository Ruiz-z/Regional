// Formatea timestamps como "hace 5 min" / "hace 1 h" / "ayer" / fecha,
// replicando el estilo de los mockups (sr-notif-meta, sr-tl-meta).

export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const when = new Date(iso).getTime();
  const diffMs = Math.max(0, now.getTime() - when);
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;

  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return 'ayer';
  if (diffD < 7) return `hace ${diffD} días`;

  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}