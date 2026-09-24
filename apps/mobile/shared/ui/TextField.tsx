import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing } from "@/shared/constants/tokens";
import { Text } from "@/shared/ui/Text";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  error,
  containerStyle,
  style,
  ...inputProps
}: TextFieldProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="label">{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        autoCapitalize="none"
        {...inputProps}
        style={[styles.input, error != null && styles.inputError, style]}
      />
      {error != null ? (
        <Text
          variant="caption"
          color={colors.statusDanger}
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { display: "flex", flexDirection: "column", gap: spacing.sm },
  input: {
    fontFamily: "System",
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputError: { borderColor: colors.statusDanger },
  error: { marginTop: -spacing.xs },
});
