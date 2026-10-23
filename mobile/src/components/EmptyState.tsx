import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { AppButton } from './AppButton';

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.orbWrap}>
        <View style={styles.orb}>
          <Text style={styles.orbIcon}>{icon ?? '📋'}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  orbWrap: {
    marginBottom: 20,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
  button: { marginTop: 20, minWidth: 200 },
});
