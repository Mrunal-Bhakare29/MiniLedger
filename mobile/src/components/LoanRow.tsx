import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '../theme';
import type { Loan } from '../types';
import { formatDate, formatInr } from '../utils/format';
import { StatusBadge } from './StatusBadge';

export function LoanRow({ loan, onPress }: { loan: Loan; onPress: () => void }) {
  const amountColor =
    loan.status === 'repaid'
      ? colors.success
      : loan.isOverdue
        ? colors.danger
        : colors.navy;

  const initials = loan.friendName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.92 : 1 }]}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.topLine}>
              <Text style={styles.name} numberOfLines={1}>{loan.friendName}</Text>
              <StatusBadge loan={loan} />
            </View>
            <Text style={styles.due}>
              {loan.dueDate ? `Due ${formatDate(loan.dueDate)}` : 'No due date'}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {formatInr(loan.amount)}
          </Text>
          {loan.status === 'repaid' && (
            <Text style={styles.repaidNote}>Fully repaid</Text>
          )}
          {loan.status === 'active' && loan.isOverdue && (
            <Text style={styles.overdueNote}>Past due date</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { marginBottom: 10 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  due: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  repaidNote: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  overdueNote: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});
