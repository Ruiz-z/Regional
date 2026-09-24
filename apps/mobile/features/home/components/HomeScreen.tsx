import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/shared/constants/tokens";
import type { ParcelSummary } from "@/shared/types/parcel";
import { Text } from "@/shared/ui/Text";
import { Screen } from "@/shared/ui/Screen";
import { ConnectionBanner } from "@/shared/ui/ConnectionBanner";
import { useAuth } from "@/shared/contexts/AuthContext";
import { getParcelSummaries } from "@/features/home/actions/getParcelSummaries";
import { ParcelRow } from "@/features/home/components/ParcelRow";

// AP-003: Home del Agricultor — mapa de parcelas (réplica de site/m-inicio.html).
export function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { session: user } = useAuth();
  const [parcels, setParcels] = useState<ParcelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setParcels(await getParcelSummaries());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar tus parcelas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const firstName = user?.name?.split(" ")[0] ?? "Agricultor";

  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <Text variant="muted">Hola, {firstName}</Text>
        <Text variant="display">Mis parcelas</Text>
        <Text variant="muted">Este es el estado de tus parcelas hoy.</Text>
      </View>
      <ConnectionBanner
        state={loading ? "retrying" : error ? "offline" : "synced"}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text variant="muted">{error}</Text>
          <Text onPress={() => void load()}>Reintentar</Text>
        </View>
      ) : (
        <FlatList
          refreshing={loading}
          onRefresh={() => void load()}
          ListEmptyComponent={<Text>No tienes parcelas registradas.</Text>}
          data={parcels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ParcelRow
              parcel={item}
              onPress={() => router.push(`/parcela/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.lg },
  header: { marginTop: spacing.sm, gap: spacing.xs },
  center: { paddingVertical: spacing.xxxl, alignItems: "center" },
  list: { paddingBottom: spacing.xxl },
  separator: { height: spacing.md },
});
