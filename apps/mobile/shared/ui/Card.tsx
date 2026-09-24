import { type ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "@/shared/constants/tokens";

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  danger?: boolean;
}

export function Card({
  children,
  style,
  danger = false,
}: CardProps): React.JSX.Element {
  return (
    <View style={[styles.card, danger && styles.danger, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  danger: { borderColor: colors.statusDanger, borderWidth: 2 },
});
