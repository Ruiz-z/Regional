import { Ionicons } from '@expo/vector-icons';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/constants/tokens';
import { Text } from '@/shared/ui/Text';

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'water';

export interface BadgeProps {
  label: string;
  tone: BadgeTone;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  ok: { bg: colors.statusOkSoft, fg: colors.statusOk },
  warn: { bg: colors.statusWarnSoft, fg: colors.statusWarn },
  danger: { bg: colors.statusDangerSoft, fg: colors.statusDanger },
  info: { bg: colors.statusInfoSoft, fg: colors.statusInfo },
  water: { bg: colors.accentSoft, fg: colors.accent },
};

export function Badge({ label, tone, icon, small = false, style }: BadgeProps): React.JSX.Element {
  const palette = tones[tone];
  return (
    <View style={[styles.base, { backgroundColor: palette.bg }, small && styles.small, style]}>
      <Ionicons name={icon} size={small ? 13 : 15} color={palette.fg} style={styles.icon} />
      <Text variant="caption" bold color={palette.fg} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 8, paddingVertical: 1 },
  icon: { flexShrink: 0 },
  label: { fontFamily: typography.fontSans, fontSize: 13, lineHeight: 18, fontWeight: '700' },
});