import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/constants/tokens';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

// AP-006: Alertas (notificaciones de la parcela: riego programado, plaga
// detectada, conexión). Lugar reservado — se implementa en su propia task.
export function NotificationsScreen(): React.JSX.Element {
  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <Text variant="display">Alertas</Text>
        <Text variant="muted">Historial y avisos de tu parcela.</Text>
      </View>
      <Card style={styles.placeholder}>
        <Text bold style={styles.placeholderTitle}>
          Notificaciones
        </Text>
        <Text variant="muted">Pendiente de implementación (AP-006).</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.lg },
  header: { marginTop: spacing.sm, gap: spacing.xs },
  placeholder: { gap: spacing.xs },
  placeholderTitle: { color: colors.primary },
});