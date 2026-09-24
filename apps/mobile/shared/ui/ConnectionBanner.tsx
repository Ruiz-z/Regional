import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/shared/constants/tokens";
import { Text } from "@/shared/ui/Text";

export type ConnectionState = "synced" | "offline" | "retrying";

const tones: Record<ConnectionState, { bg: string; fg: string }> = {
  synced: { bg: colors.statusOkSoft, fg: colors.statusOk },
  offline: { bg: colors.statusOfflineSoft, fg: colors.statusOffline },
  retrying: { bg: colors.statusWarnSoft, fg: colors.statusWarn },
};

const labels: Record<ConnectionState, string> = {
  synced: "Conectado · consulta completada",
  offline: "Sin conexión",
  retrying: "Reintentando conexión…",
};

export function ConnectionBanner({
  state = "synced",
}: {
  state?: ConnectionState;
}): React.JSX.Element {
  const tone = tones[state];
  const icon =
    state === "synced"
      ? ("checkmark" as const)
      : state === "offline"
        ? ("cloud-offline" as const)
        : ("refresh" as const);

  return (
    <View style={[styles.banner, { backgroundColor: tone.bg }]} role="status">
      {state === "retrying" ? (
        <Ionicons name={icon} size={16} color={tone.fg} style={styles.spin} />
      ) : (
        <Ionicons name={icon} size={16} color={tone.fg} />
      )}
      <Text variant="caption" bold color={tone.fg}>
        {labels[state]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  spin: { transform: [{ rotate: "0deg" }] },
});
