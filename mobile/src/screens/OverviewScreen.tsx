import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoanRow } from '../components/LoanRow';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { colors, radius, shadows, spacing } from '../theme';
import { fetchLoans, fetchSummary } from '../api/loans';
import type { Loan, LoanFilter, LoanSummary } from '../types';
import { formatInr } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Overview'>,
  NativeStackScreenProps<AppStackParamList>
>;

const FILTERS: { id: LoanFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'active', label: 'Active', icon: '🔵' },
  { id: 'overdue', label: 'Overdue', icon: '🔴' },
  { id: 'repaid', label: 'Repaid', icon: '✅' },
];

export function OverviewScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LoanFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextSummary, nextLoans] = await Promise.all([
        fetchSummary(),
        fetchLoans({ search, status, order: 'asc' }),
      ]);
      setSummary(nextSummary);
      setLoans(nextLoans);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Repayment progress ratio
  const totalLent = summary ? parseFloat(summary.totalLent) : 0;
  const totalRepaid = summary ? parseFloat(summary.totalRepaid) : 0;
  const outstanding = summary ? parseFloat(summary.outstandingAmount) : 0;
  const overdueAmt = summary ? parseFloat(summary.overdueAmount) : 0;
  const repaidRatio = totalLent > 0 ? totalRepaid / totalLent : 0;
  const overdueRatio = outstanding > 0 ? overdueAmt / outstanding : 0;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}>

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Overview</Text>
          <Text style={styles.pageSubtitle}>Your complete financial picture</Text>
        </View>

        <ErrorBanner message={error} />

        {/* Summary Stats Grid */}
        {summary ? (
          <>
            <View style={styles.statsGrid2x2}>
              <View style={styles.statsRow}>
                <StatCard
                  label="Total Lent"
                  value={formatInr(summary.totalLent)}
                  icon="💸"
                  accent={colors.navy}
                  accentLight={colors.accentLight}
                />
                <StatCard
                  label="Outstanding"
                  value={formatInr(summary.outstandingAmount)}
                  icon="⏳"
                  accent={colors.warning}
                  accentLight={colors.warningLight}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  label="Total Repaid"
                  value={formatInr(summary.totalRepaid)}
                  icon="✅"
                  accent={colors.success}
                  accentLight={colors.successLight}
                />
                <StatCard
                  label="Overdue"
                  value={formatInr(summary.overdueAmount)}
                  icon="⚠️"
                  accent={colors.danger}
                  accentLight={colors.dangerLight}
                />
              </View>
            </View>

            {/* Loan Count Row */}
            <View style={styles.countRow}>
              <CountChip
                label="Active"
                count={summary.activeLoansCount}
                color={colors.accent}
                bg={colors.accentLight}
              />
              <CountChip
                label="Overdue"
                count={summary.overdueLoansCount}
                color={colors.danger}
                bg={colors.dangerLight}
              />
              <CountChip
                label="Repaid"
                count={summary.repaidLoansCount}
                color={colors.success}
                bg={colors.successLight}
              />
            </View>

            {/* Repayment Progress */}
            {totalLent > 0 && (
              <Card style={styles.progressCard}>
                <Text style={styles.progressTitle}>📈 Repayment Progress</Text>
                <View style={styles.progressSection}>
                  <ProgressBar
                    label="Amount recovered"
                    value={repaidRatio}
                    fillColor={colors.success}
                    leftLabel={formatInr(summary.totalRepaid)}
                    rightLabel={`of ${formatInr(summary.totalLent)}`}
                  />
                  {outstanding > 0 && (
                    <ProgressBar
                      label="Overdue share of outstanding"
                      value={overdueRatio}
                      fillColor={colors.danger}
                      leftLabel={formatInr(summary.overdueAmount)}
                      rightLabel={`of ${formatInr(summary.outstandingAmount)}`}
                    />
                  )}
                </View>
              </Card>
            )}

            {/* Financial Insights */}
            <Card style={styles.insightCard}>
              <Text style={styles.insightTitle}>💡 Financial Insights</Text>
              <InsightRow
                icon="📊"
                text={`You have ${summary.activeLoansCount} active loan${summary.activeLoansCount !== 1 ? 's' : ''} worth ${formatInr(summary.outstandingAmount)}`}
              />
              {summary.overdueLoansCount > 0 && (
                <InsightRow
                  icon="🔴"
                  text={`${summary.overdueLoansCount} loan${summary.overdueLoansCount !== 1 ? 's are' : ' is'} past due — ${formatInr(summary.overdueAmount)} overdue`}
                  accent={colors.danger}
                />
              )}
              {summary.repaidLoansCount > 0 && (
                <InsightRow
                  icon="🎉"
                  text={`${summary.repaidLoansCount} loan${summary.repaidLoansCount !== 1 ? 's' : ''} fully repaid — ${formatInr(summary.totalRepaid)} recovered`}
                  accent={colors.success}
                />
              )}
              {totalLent > 0 && repaidRatio >= 0.5 && (
                <InsightRow
                  icon="🌟"
                  text={`${Math.round(repaidRatio * 100)}% of your total lending has been repaid`}
                  accent={colors.success}
                />
              )}
              {summary.activeLoansCount === 0 && summary.repaidLoansCount === 0 && (
                <InsightRow icon="👋" text="Add your first loan to start tracking your lending" />
              )}
            </Card>
          </>
        ) : loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.navy} size="large" />
            <Text style={styles.loadingText}>Loading overview…</Text>
          </View>
        ) : null}

        {/* Loan List Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Loan Records</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by friend name…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setStatus(f.id)}
              style={[styles.chip, status === f.id && styles.chipActive]}>
              <Text style={[styles.chipText, status === f.id && styles.chipTextActive]}>
                {f.icon} {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Loan list */}
        {loading && !refreshing ? (
          <ActivityIndicator color={colors.navy} style={styles.listLoader} />
        ) : loans.length === 0 ? (
          <EmptyState
            title={search ? 'No matching loans' : 'No loans in this filter'}
            message={
              search
                ? `No loans found for "${search}". Try a different name.`
                : 'Try a different filter or add a new loan.'
            }
            icon={search ? '🔍' : '📋'}
          />
        ) : (
          loans.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              onPress={() => navigation.navigate('LoanDetails', { loanId: loan.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function CountChip({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <View style={[styles.countChip, { backgroundColor: bg }]}>
      <Text style={[styles.countNumber, { color }]}>{count}</Text>
      <Text style={[styles.countLabel, { color }]}>{label}</Text>
    </View>
  );
}

function InsightRow({
  icon,
  text,
  accent,
}: {
  icon: string;
  text: string;
  accent?: string;
}) {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightIcon}>{icon}</Text>
      <Text style={[styles.insightText, accent ? { color: accent } : {}]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },

  pageHeader: { marginBottom: spacing.md },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },

  statsGrid2x2: { gap: 10, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },

  countRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  countChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  countNumber: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  countLabel: { fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },

  progressCard: { marginBottom: 14 },
  progressTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 },
  progressSection: { gap: 4 },

  insightCard: { marginBottom: 20 },
  insightTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  insightIcon: { fontSize: 14, lineHeight: 20 },
  insightText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontWeight: '500' },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  listLoader: { marginTop: 32 },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, minHeight: 46, color: colors.text, fontSize: 14 },
  searchClear: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 4 },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.white },
});
