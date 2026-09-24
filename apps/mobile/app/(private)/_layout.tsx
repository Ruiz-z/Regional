import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/shared/constants/tokens';
import { useAuth } from '@/shared/contexts/AuthContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// AP-002: área privada. Requiere sesión activa (guard), mientras se
// restaura desde SecureStore muestra un spinner. Solo rol Agricultor usa
// la app; navegación con 3 tabs según mockup: Inicio / Alertas / Perfil.
export default function PrivateLayout(): React.JSX.Element {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  const tabIcon = (focused: boolean, focusedName: IoniconName, unfocusedName: IoniconName) => (
    <Ionicons
      name={focused ? focusedName : unfocusedName}
      size={24}
      color={focused ? colors.primary : colors.inkMuted}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: 'sans-serif-medium', fontWeight: '700', color: colors.ink },
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi parcela',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          title: 'Alertas',
          tabBarLabel: 'Alertas',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'notifications', 'notifications-outline'),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});