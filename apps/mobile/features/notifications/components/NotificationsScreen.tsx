import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { api, apiRequest, ApiError } from "@/shared/lib/api";
import { notificationRoute } from "@/features/notifications/lib/notificationRoute";
import { colors } from "@/shared/constants/tokens";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
type Notice = {
  id: string;
  title?: string;
  message: string;
  severity: "INFO" | "CRITICAL";
  read: boolean;
  createdAt: string;
  zoneId?: string;
  parcelId?: string;
};
export function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await api.get<Notice[]>("/notifications"));
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 404
          ? "El servicio de notificaciones todavía no está disponible."
          : e instanceof Error
            ? e.message
            : "No se pudieron cargar las notificaciones",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function open(item: Notice) {
    try {
      if (!item.read) {
        await apiRequest(`/notifications/${encodeURIComponent(item.id)}/read`, {
          method: "PATCH",
        });
        setItems((current) =>
          current.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
        );
      }
      const route = notificationRoute(item);
      if (route) router.push(route);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo marcar como leída");
    }
  }
  return (
    <Screen style={{ padding: 20, gap: 16 }}>
      <Text variant="display">Notificaciones</Text>
      {error ? (
        <>
          <Text accessibilityRole="alert">{error}</Text>
          <Button title="Reintentar" onPress={() => void load()} />
        </>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        refreshing={loading}
        onRefresh={() => void load()}
        ListEmptyComponent={
          !loading && !error ? <Text>No tienes notificaciones.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.read ? "Leída" : "No leída"}: ${item.title ?? item.message}`}
            onPress={() => void open(item)}
            style={{
              padding: 16,
              gap: 8,
              borderBottomWidth: 1,
              borderColor: colors.border,
              backgroundColor:
                item.severity === "CRITICAL"
                  ? colors.statusDangerSoft
                  : colors.surface,
            }}
          >
            <View>
              <Badge
                icon={
                  item.severity === "CRITICAL"
                    ? "warning"
                    : "information-circle"
                }
                tone={item.severity === "CRITICAL" ? "danger" : "info"}
                label={item.severity === "CRITICAL" ? "Crítica" : "Informativa"}
              />
              <Text bold={!item.read}>{item.title ?? item.message}</Text>
              {item.title ? <Text>{item.message}</Text> : null}
              <Text variant="muted">
                {new Date(item.createdAt).toLocaleString("es-MX")} ·{" "}
                {item.read ? "Leída" : "No leída"}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
