import { colors } from "@/shared/constants/tokens";

// Cooldown de tratamiento por zona (spec-005 RF-8): 10 minutos desde el
// último tratamiento (automático o manual), visible en la UI (RF-9).
export const TREATMENT_COOLDOWN_MS = 10 * 60_000;

export interface Cooldown {
  active: boolean;
  remainingMs: number;
  label: string;
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function treatmentCooldown(
  lastTreatmentAt: string | null,
  now: Date = new Date(),
): Cooldown {
  if (!lastTreatmentAt) {
    return { active: false, remainingMs: 0, label: "" };
  }
  const elapsed = now.getTime() - new Date(lastTreatmentAt).getTime();
  const remainingMs = TREATMENT_COOLDOWN_MS - elapsed;
  if (remainingMs <= 0) {
    return { active: false, remainingMs: 0, label: "" };
  }
  return { active: true, remainingMs, label: `Espera ${mmss(remainingMs)}` };
}

export function cooldownColor(active: boolean): string {
  return active ? colors.statusWarn : colors.statusOk;
}
