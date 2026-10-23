import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F5BFBF',
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: { fontSize: 14, lineHeight: 20 },
  text: { flex: 1, color: colors.danger, fontWeight: '600', fontSize: 13, lineHeight: 20 },
});
