import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import type { Loan } from '../types';

type Tone = 'active' | 'overdue' | 'repaid';

export function StatusBadge({ loan }: { loan: Loan }) {
  const tone: Tone = loan.status === 'repaid' ? 'repaid' : loan.isOverdue ? 'overdue' : 'active';

  const config: Record<Tone, { label: string; dot: string; bg: string; text: string }> = {
    active: {
      label: 'Active',
      dot: colors.warning,
      bg: colors.warningLight,
      text: '#B45309',
    },
    overdue: {
      label: 'Overdue',
      dot: colors.danger,
      bg: colors.dangerLight,
      text: colors.danger,
    },
    repaid: {
      label: 'Repaid',
      dot: colors.success,
      bg: colors.successLight,
      text: '#2D7A57',
    },
  };

  const { label, dot, bg, text } = config[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
