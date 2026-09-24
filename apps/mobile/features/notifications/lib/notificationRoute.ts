export function notificationRoute(
  data: Record<string, unknown>,
): { pathname: "/zona/[id]"; params: { id: string; parcelId: string } } | null {
  const { zoneId, parcelId } = data;
  const valid = (value: unknown): value is string =>
    typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
  return valid(zoneId) && valid(parcelId)
    ? { pathname: "/zona/[id]", params: { id: zoneId, parcelId } }
    : null;
}
