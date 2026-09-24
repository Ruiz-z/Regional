import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/constants/tokens';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

// AP-007: Perfil del Agricultor. Lugar reservado — se implementa en su
// propia task.
export function ProfileScreen(): React.JSX.Element {
  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <Text variant="display">Perfil</Text>
        <Text variant="muted">Tus datos y configuración de cuenta.</Text>
      </View>
      <Card style={styles.placeholder}>
        <Text bold style={styles.placeholderTitle}>
          Perfil
        </Text>
        <Text variant="muted">Pendiente de implementación (AP-007).</Text>
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