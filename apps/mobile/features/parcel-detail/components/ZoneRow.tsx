import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing, shadows } from "@/shared/constants/tokens";
import type { Zone } from "@/shared/types/parcel";
import { Text } from "@/shared/ui/Text";
import { Badge } from "@/shared/ui/Badge";
import { irrigationBadge, pestBadge } from "@/shared/lib/zoneStatus";

export interface ZoneRowProps {
  zone: Zone;
  onPress: () => void;
}

export function ZoneRow({ zone, onPress }: ZoneRowProps): React.JSX.Element {
  const irrigation = irrigationBadge(zone.irrigation);
  const pest = pestBadge(zone.pestState);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${zone.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.body}>
        <Text variant="label" style={styles.name}>
          {zone.name}
        </Text>
        <View style={styles.badges}>
          <Badge
            small
            tone={irrigation.tone}
            icon={irrigation.icon}
            label={irrigation.label}
          />
          <Badge small tone={pest.tone} icon={pest.icon} label={pest.label} />
        </View>
      </View>
      <View style={styles.reading}>
        <Text bold style={styles.value}>
          {zone.latestHumidity === null ? "?" : `${zone.latestHumidity}%`}
        </Text>
        <Text variant="caption" color={colors.inkMuted}>
          humedad
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: spacing.sm },
  name: { fontWeight: "700" },
  badges: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  reading: { alignItems: "flex-end" },
  value: { fontSize: 19, lineHeight: 24 },
});
