import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing, shadows } from '@/shared/constants/tokens';
import type { ParcelSummary } from '@/shared/types/parcel';
import { Text } from '@/shared/ui/Text';
import { Badge, type BadgeTone } from '@/shared/ui/Badge';

export interface ParcelRowProps {
  parcel: ParcelSummary;
  onPress: () => void;
}

export function ParcelRow({ parcel, onPress }: ParcelRowProps): React.JSX.Element {
  const atRisk = parcel.aggregate === 'INTERVENCION';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${parcel.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <Text variant="title" numberOfLines={1} style={styles.name}>
          {parcel.name}
        </Text>
        <Badge
          tone={atRisk ? 'danger' : 'ok'}
          icon={atRisk ? 'warning' : 'checkmark-circle'}
          label={atRisk ? 'Intervención' : 'Normal'}
          small
        />
      </View>
      <Text variant="muted">
        {parcel.crop} · {parcel.areaHa.toLocaleString('es-MX')} ha · {parcel.zoneCount} zonas
      </Text>
      {atRisk ? (
        <View style={[styles.foot, styles.footDanger]}>
          <Ionicons name="alert-circle" size={14} color={colors.statusDanger} />
          <Text variant="caption" bold color={colors.statusDanger}>
            Zona {parcel.alertZoneName} requiere atención
          </Text>
        </View>
      ) : (
        <Text variant="caption" color={colors.inkMuted} style={styles.foot}>
          Última lectura · al día
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  name: { flex: 1 },
  foot: { marginTop: spacing.xs },
  footDanger: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});