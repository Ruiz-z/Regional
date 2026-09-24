import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";

import { colors, spacing } from "@/shared/constants/tokens";
import { useAuth } from "@/shared/contexts/AuthContext";
import { Text } from "@/shared/ui/Text";
import { TextField } from "@/shared/ui/TextField";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";

// Réplica de site/index.html adaptada a mobile (login). Panel de marca
// oscuro arriba + formulario abajo. Solo rol Agricultor usa la app; el
// backend valida igual (Spec 001 RF-1/RF-2).
export function LoginScreen(): React.JSX.Element {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("ana.torres@smartriego.mx");
  const [password, setPassword] = useState("demo1234");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      router.replace("/(private)");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "No se pudo iniciar sesión";
      setError(message);
      Alert.alert("No se pudo iniciar sesión", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.brand}>
          <View style={styles.brandBlocks}>
            <View style={styles.blockPrimary} />
            <View style={styles.blockAccent} />
            <View style={styles.blockDark} />
          </View>
          <Text
            variant="display"
            color={colors.inkOnInverse}
            style={styles.brandName}
          >
            {`SmartRiego\nMX`}
          </Text>
          <Text color={colors.inkOnInverse} style={styles.brandTagline}>
            Riego y control de plagas por zona, en tiempo real.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formHeader}>
            <Text variant="display" style={styles.formTitle}>
              Bienvenido de vuelta
            </Text>
            <Text color={colors.inkMuted}>
              Entra para ver el estado de tus parcelas.
            </Text>
          </View>

          <View style={styles.fields}>
            <TextField
              label="Correo"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              testID="login-email"
            />
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={handleSubmit}
              testID="login-password"
            />
            <View style={styles.forgotRow}>
              <Button
                variant="ghost"
                title="¿Olvidaste tu contraseña?"
                onPress={() => undefined}
                style={styles.forgot}
              />
            </View>
          </View>

          {error != null ? (
            <Text variant="caption" color={colors.statusDanger}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Iniciar sesión"
            onPress={handleSubmit}
            size="lg"
            loading={submitting}
            testID="login-submit"
          />

          <Text variant="muted" style={styles.footer}>
            {`SmartRiego MX · plataforma de agricultura de precisión`}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const blockSize = 12;
const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  brand: {
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + 8,
    paddingBottom: spacing.xl,
    overflow: "hidden",
  },
  brandBlocks: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  blockPrimary: {
    width: spacing.xxxl,
    height: blockSize * 3,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary,
  },
  blockAccent: {
    width: blockSize * 3,
    height: blockSize * 2,
    borderRadius: spacing.sm,
    backgroundColor: colors.accent,
    opacity: 0.85,
  },
  blockDark: {
    width: blockSize * 6,
    height: blockSize,
    borderRadius: 5,
    backgroundColor: colors.suedeGreen,
  },
  brandName: { letterSpacing: -0.01 },
  brandTagline: {
    marginTop: spacing.md,
    opacity: 0.75,
    maxWidth: 260,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  formHeader: { gap: spacing.xs },
  formTitle: { fontSize: 26, lineHeight: 32 },
  fields: { gap: spacing.lg },
  forgotRow: { alignItems: "flex-end", marginTop: -spacing.xs },
  forgot: { minHeight: 32, paddingHorizontal: 0 },
  footer: {
    textAlign: "center",
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
