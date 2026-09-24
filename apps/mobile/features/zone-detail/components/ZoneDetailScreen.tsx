import Notifications from "@/shared/lib/notifications";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { getParcel } from "@/features/parcel-detail/actions/getParcel";
import { useAuth } from "@/shared/contexts/AuthContext";
import { canTreat } from "@/shared/lib/treatmentPolicy";
import { api, ApiError } from "@/shared/lib/api";
import { treatmentCooldown } from "@/shared/lib/cooldown";
import { pestBadge, irrigationBadge } from "@/shared/lib/zoneStatus";
import type { Parcel } from "@/shared/types/parcel";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
export function ZoneDetailScreen() {
  const { id, parcelId } = useLocalSearchParams<{
    id: string;
    parcelId: string;
  }>();
  const { session } = useAuth();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const load = useCallback(async () => {
    try {
      setError("");
      if (!parcelId)
        throw new Error(
          "La notificación no contiene la parcela. Abre la zona desde Inicio.",
        );
      setParcel(await getParcel(parcelId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la zona");
    }
  }, [parcelId]);
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const timer = setInterval(() => {
      setNow(new Date());
      void load();
    }, 60000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const zone = parcel?.zones.find((z) => z.id === id);
  const cooldown = treatmentCooldown(zone?.lastTreatmentAt ?? null, now);
  const owner =
    session?.role === "AGRICULTOR" && session.userId === parcel?.ownerId;
  const allowed =
    zone &&
    canTreat(
      {
        role: session?.role,
        userId: session?.userId,
        ownerId: parcel?.ownerId,
        pestState: zone.pestState,
        lastTreatmentAt: zone.lastTreatmentAt,
      },
      now.getTime(),
    ) &&
    !error;
  async function treat() {
    if (!allowed || busy) return;
    setBusy(true);
    try {
      await api.post(`/zones/${encodeURIComponent(id)}/treat`);
      await load();
      Alert.alert(
        "Tratamiento solicitado",
        "Tratamiento simulado con agua únicamente en esta zona.",
      );
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 409
          ? "La zona está en cooldown. Actualiza para consultar el estado."
          : e instanceof Error
            ? e.message
            : "No se pudo activar el tratamiento",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text variant="display">{zone?.name ?? "Zona"}</Text>
        <Text variant="muted">{parcel?.name}</Text>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <Button
          title="Actualizar"
          variant="ghost"
          onPress={() => void load()}
        />
        {!zone ? (
          <Text>{parcel ? "Zona no encontrada" : "Cargando zona…"}</Text>
        ) : (
          <>
            <Card>
              <Text variant="display">
                {zone.latestHumidity === null
                  ? "Sin lectura"
                  : `${zone.latestHumidity}%`}
              </Text>
              <Text>Objetivo {zone.humidityThreshold}%</Text>
              <Text>
                Temperatura:{" "}
                {zone.latestTemperature === null
                  ? "sin lectura"
                  : `${zone.latestTemperature} °C`}
              </Text>
              <Badge {...irrigationBadge(zone.irrigation)} />
              <Badge {...pestBadge(zone.pestState)} />
            </Card>
            <Card>
              <Text bold>Mini-histórico</Text>
              <Text variant="muted">
                Aún no hay lecturas, decisiones ni eventos disponibles para
                esta zona.
              </Text>
            </Card>
            {owner && (
              <>
                <Text>
                  Tratamiento simulado con agua, exclusivo de esta zona.
                </Text>
                <Button
                  title={
                    cooldown.active ? cooldown.label : "Activar tratamiento"
                  }
                  disabled={!allowed}
                  loading={busy}
                  onPress={() =>
                    Alert.alert(
                      "Confirmar tratamiento",
                      `Aplicar agua solo en ${zone.name}.`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Activar", onPress: () => void treat() },
                      ],
                    )
                  }
                />
                {zone.pestState === "UNKNOWN" && (
                  <Text variant="muted">
                    No se puede activar sin conocer el estado de plaga y el
                    último tratamiento.
                  </Text>
                )}
              </>
            )}
          </>
        )}
        {__DEV__ && zone && (
          <Button
            title="Simular notificación de esta zona"
            variant="ghost"
            onPress={() =>
              void Notifications.scheduleNotificationAsync({
                content: {
                  title: "Prueba de navegación",
                  body: zone.name,
                  data: { zoneId: zone.id, parcelId },
                },
                trigger: null,
              }).catch(() =>
                setError(
                  "No se pudo simular la notificación. Revisa los permisos.",
                ),
              )
            }
          />
        )}
      </ScrollView>
    </Screen>
  );
}
