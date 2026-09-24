import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
  ActivityIndicator,
} from "react-native";

import { colors, radius, spacing, shadows } from "@/shared/constants/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const palette: Record<Variant, { bg: string; fg: string; pressed: string }> = {
  primary: {
    bg: colors.primary,
    fg: colors.onPrimary,
    pressed: colors.primaryHover,
  },
  secondary: {
    bg: colors.surface,
    fg: colors.ink,
    pressed: colors.surfaceSunken,
  },
  ghost: { bg: "transparent", fg: colors.primary, pressed: colors.primarySoft },
  danger: {
    bg: colors.surface,
    fg: colors.statusDanger,
    pressed: colors.statusDangerSoft,
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  testID,
  style,
}: ButtonProps): React.JSX.Element {
  const tones = palette[variant];
  const isSm = size === "md";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: tones.bg,
          borderColor:
            variant === "secondary" ? colors.borderStrong : "transparent",
        },
        isSm && styles.md,
        !isSm && styles.lg,
        variant === "ghost" && styles.borderless,
        pressed && { backgroundColor: tones.pressed },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "secondary" ||
            variant === "ghost" ||
            variant === "danger"
              ? tones.fg
              : colors.onPrimary
          }
        />
      ) : (
        <Text style={[styles.label, { color: tones.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    minHeight: 44,
    ...shadows.card,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  borderless: { borderWidth: 0 },
  label: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  disabled: { opacity: 0.5 },
});
