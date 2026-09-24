import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "@/shared/constants/tokens";
import { useAuth } from "@/shared/contexts/AuthContext";
import { LoginScreen } from "@/features/login/components/LoginScreen";

// AP-001: pantalla de login. Si ya hay sesión (o persistiendo desde
// SecureStore), redirige directo al área privada (tabs).
export default function LoginRoute(): React.JSX.Element {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(private)" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
