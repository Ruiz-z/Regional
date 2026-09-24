import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/shared/constants/tokens";
import type { Parcel } from "@/shared/types/parcel";
import { Text } from "@/shared/ui/Text";
import { Screen } from "@/shared/ui/Screen";
import { Badge } from "@/shared/ui/Badge";
import { ConnectionBanner } from "@/shared/ui/ConnectionBanner";
import { getParcel } from "@/features/parcel-detail/actions/getParcel";
import { ZoneRow } from "@/features/parcel-detail/components/ZoneRow";

// AP-004: Detalle de parcela con lista de zonas (réplica de site/m-parcela.html).
// Ruta: /parcela/:id (empujada desde Home sobre los tabs).
export function ParcelDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id) throw new Error("Parcela no encontrada");
      setParcel(await getParcel(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la parcela");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error || !parcel) {
    return (
      <Screen style={styles.center}>
        <Text variant="muted">{error ?? "Parcela no encontrada"}</Text>
        <Text onPress={() => void load()}>Reintentar</Text>
      </Screen>
    );
  }

  const atRisk = parcel.zones.some((z) => z.pestState === "INTERVENCION");

  return (
    <Screen style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="title" style={styles.name}>
            {parcel.name}
          </Text>
          <Badge
            tone={atRisk ? "danger" : "info"}
            icon={atRisk ? "warning" : "checkmark-circle"}
            label={atRisk ? "Intervención" : "Sin datos de estado"}
          />
          <Text variant="muted">
            {parcel.crop} · {parcel.zoneCount} zonas
          </Text>
        </View>
        <ConnectionBanner state="synced" />
        {parcel.zones.map((zone, i) => (
          <View key={zone.id} style={i > 0 ? styles.row : undefined}>
            <ZoneRow
              zone={zone}
              onPress={() =>
                router.push({
                  pathname: "/zona/[id]",
                  params: { id: zone.id, parcelId: parcel.id },
                })
              }
            />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { marginTop: spacing.sm, gap: spacing.xs },
  name: { fontWeight: "700" },
  row: { marginTop: spacing.md },
});
