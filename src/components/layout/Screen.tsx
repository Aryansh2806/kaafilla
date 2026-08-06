import type { ReactNode } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

// Base screen wrapper: safe area + app bg + optional scroll + keyboard avoidance.
export function Screen({ children, scroll, padded = true, edges = ['top'], style, contentStyle }: Props) {
  const t = useTheme();
  const pad = padded ? { paddingHorizontal: t.spacing[5] } : null;
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[pad, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: t.colors.bg }, style]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
