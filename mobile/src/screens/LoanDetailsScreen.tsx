import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, shadows, spacing } from '../theme';
import { deleteLoan, fetchLoan, repayLoan } from '../api/loans';
import type { Loan } from '../types';
import { formatDate, formatInr } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'LoanDetails'>;

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'right', flex: 1, marginLeft: 16 },
});

export function LoanDetailsScreen({ navigation, route }: Props) {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoan(await fetchLoan(loanId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmRepay = () => {
    Alert.alert(
      'Mark as Repaid?',
      `Record that ${loan?.friendName} has repaid ${formatInr(loan?.amount ?? '0')}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Repaid ✓',
          onPress: async () => {
            setWorking(true);
            try {
              setLoan(await repayLoan(loanId));
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Loan?',
      'This will permanently remove the loan record and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setWorking(true);
            try {
              await deleteLoan(loanId);
              navigation.goBack();
            } catch (err) {
              setError(getErrorMessage(err));
              setWorking(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} size="large" />
        <Text style={styles.loadingText}>Loading loan…</Text>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>🔍</Text>
        <ErrorBanner message={error ?? 'Loan not found'} />
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isRepaid = loan.status === 'repaid';
  const isOverdue = loan.isOverdue;

  const statusColor = isRepaid
    ? colors.success
    : isOverdue
      ? colors.danger
      : colors.warning;

  const initials = loan.friendName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ErrorBanner message={error} />

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.friendName}>{loan.friendName}</Text>
        <Text style={[styles.amount, { color: statusColor }]}>{formatInr(loan.amount)}</Text>
        <View style={styles.badgeWrap}>
          <StatusBadge loan={loan} />
        </View>
      </View>

      {/* Details Card */}
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>Loan Details</Text>
        <DetailRow label="Amount Lent" value={formatInr(loan.amount)} valueColor={colors.navy} />
        <DetailRow
          label="Due Date"
          value={loan.dueDate ? formatDate(loan.dueDate) : 'Not set'}
          valueColor={isOverdue && !isRepaid ? colors.danger : undefined}
        />
        <DetailRow
          label="Status"
          value={isRepaid ? 'Repaid' : isOverdue ? 'Overdue' : 'Active'}
          valueColor={statusColor}
        />
        {loan.repaidAt ? (
          <DetailRow
            label="Repaid On"
            value={formatDate(loan.repaidAt.slice(0, 10))}
            valueColor={colors.success}
          />
        ) : null}
        <DetailRow
          label="Receipt"
          value={loan.hasReceipt ? '📎 Attached' : 'Not uploaded'}
        />
        <DetailRow
          label="Created"
          value={formatDate(loan.createdAt.slice(0, 10))}
        />
      </Card>

      {/* Status hint card */}
      {!isRepaid && isOverdue && (
        <Card variant="warning" style={styles.hintCard}>
          <Text style={styles.hintText}>
            ⚠️ This loan is past its due date of {formatDate(loan.dueDate)}. Follow up with {loan.friendName}.
          </Text>
        </Card>
      )}
      {isRepaid && (
        <Card variant="success" style={styles.hintCard}>
          <Text style={[styles.hintText, { color: '#2D7A57' }]}>
            ✅ {loan.friendName} has fully repaid this loan.
          </Text>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!isRepaid ? (
          <AppButton
            title="✓ Mark as Repaid"
            variant="success"
            onPress={confirmRepay}
            loading={working}
            disabled={working}
            style={styles.actionBtn}
          />
        ) : (
          <View style={styles.repaidTag}>
            <Text style={styles.repaidTagText}>✓ This loan has been repaid</Text>
          </View>
        )}
        <AppButton
          title="🗑 Delete Loan"
          variant="danger"
          onPress={confirmDelete}
          disabled={working}
          style={styles.deleteBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: 12,
  },
  loadingText: { color: colors.textSecondary, marginTop: 8 },
  notFound: { fontSize: 48 },
  back: { color: colors.accent, fontWeight: '700', fontSize: 15 },

  hero: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.card,
  },
  avatarText: { color: colors.accent, fontSize: 26, fontWeight: '800' },
  friendName: { fontSize: 24, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  amount: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  badgeWrap: { marginTop: 10 },

  detailCard: { marginBottom: 14 },
  detailTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },

  hintCard: { marginBottom: 14 },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A5E00',
    lineHeight: 20,
  },

  actions: { gap: 10 },
  actionBtn: {},
  deleteBtn: {},

  repaidTag: {
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B2DFC8',
  },
  repaidTagText: { color: colors.success, fontWeight: '700', fontSize: 14 },
});
