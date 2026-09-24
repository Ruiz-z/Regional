export function canTreat(
  input: {
    role?: string;
    userId?: string;
    ownerId?: string;
    pestState?: string;
    lastTreatmentAt?: string | null;
  },
  now = Date.now(),
): boolean {
  if (
    input.role !== "AGRICULTOR" ||
    !input.userId ||
    input.userId !== input.ownerId
  )
    return false;
  if (!["MONITOREO", "INTERVENCION"].includes(input.pestState ?? ""))
    return false;
  // Undefined means the server did not supply cooldown information.
  if (input.lastTreatmentAt === undefined) return false;
  if (input.lastTreatmentAt === null) return true;
  const last = Date.parse(input.lastTreatmentAt);
  return Number.isFinite(last) && now - last >= 600000;
}
