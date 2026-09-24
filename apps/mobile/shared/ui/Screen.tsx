import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/shared/constants/tokens';

interface ScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
}

// SafeAreaView de react-native-safe-area-context; las pantallas de tabs
// dejan que el tabbar maneje el bottom inset.
export function Screen({ children, style }: ScreenProps): React.JSX.Element {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});