import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/constants/tokens';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

// AP-003/Ir: Home del Agricultor (mapa de parcelas + selector de zona).
// Lugar reservado — se implementa en su propia task.
export function HomeScreen(): React.JSX.Element {
  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <Text variant="display">Mi parcela</Text>
        <Text variant="muted">Resumen del estado de tu parcela hoy.</Text>
      </View>
      <Card style={styles.placeholder}>
        <Text bold style={styles.placeholderTitle}>
          Home
        </Text>
        <Text variant="muted">Pendiente de implementación (AP-003).</Text>
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