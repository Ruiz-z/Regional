import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import { useAuth } from "@/shared/contexts/AuthContext";
import { Screen } from "@/shared/ui/Screen";
import { Card } from "@/shared/ui/Card";
import { Text } from "@/shared/ui/Text";
import { Button } from "@/shared/ui/Button";
export function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [error, setError] = useState("");
  async function requestPermission() {
    try {
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync("alerts", {
          name: "Alertas de parcelas",
          importance: Notifications.AndroidImportance.HIGH,
        });
      const result = await Notifications.requestPermissionsAsync();
      setError(
        result.granted
          ? "Permiso concedido. El envío remoto requiere habilitar el servicio de notificaciones."
          : "Permiso no concedido. Puedes cambiarlo desde Ajustes.",
      );
    } catch {
      setError("No se pudo solicitar el permiso.");
    }
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text variant="display">Perfil</Text>
        <Card>
          <Text bold>{session?.name ?? "Agricultor"}</Text>
          <Text>{session?.email}</Text>
          <Text variant="muted">Agricultor</Text>
        </Card>
        <Card>
          <Text bold>Cambiar contraseña</Text>
          <Text variant="muted">
            El cambio de contraseña todavía no está disponible. Contacta al
            administrador para recibir ayuda con tu cuenta.
          </Text>
          <Button
            title="Cambiar contraseña"
            disabled
            onPress={() => undefined}
          />
        </Card>
        <Card>
          <Text bold>Permisos de notificaciones</Text>
          <Button
            title="Solicitar permiso de notificaciones"
            onPress={() => void requestPermission()}
          />
          <Button
            title="Abrir ajustes de notificaciones"
            onPress={() =>
              void Linking.openSettings().catch(() =>
                setError("No se pudieron abrir los ajustes."),
              )
            }
          />
        </Card>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <Button
          title="Cerrar sesión"
          variant="danger"
          onPress={() =>
            void signOut().catch(() =>
              setError("No se pudo cerrar la sesión. Reintenta."),
            )
          }
        />
      </ScrollView>
    </Screen>
  );
}
