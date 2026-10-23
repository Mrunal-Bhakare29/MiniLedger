import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoanRow } from '../components/LoanRow';
import { StatCard } from '../components/StatCard';
import { colors, radius, shadows, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { fetchLoans, fetchSummary } from '../api/loans';
import type { Loan, LoanSummary } from '../types';
import { formatInr, greetingForNow } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      translateY.setValue(18);
      const anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }, [opacity, translateY, delay]),
  );
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextSummary, nextLoans] = await Promise.all([
        fetchSummary(),
        fetchLoans({ order: 'desc' }),
      ]);
      setSummary(nextSummary);
      setLoans(nextLoans.slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const greet = greetingForNow();
  const displayName = user?.displayPhone ?? '';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}>

      {/* Header */}
      <FadeInView delay={0}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greet} 👋</Text>
            <Text style={styles.brandName}>MiniLedger</Text>
            <Text style={styles.subtitle}>Track what you lend, collect what you're owed</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
            style={({ pressed }) => [styles.avatar, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.avatarText}>
              {displayName ? displayName.slice(-4) : '₹'}
            </Text>
          </Pressable>
        </View>
      </FadeInView>

      <ErrorBanner message={error} />

      {/* Summary Hero Card */}
      {summary ? (
        <FadeInView delay={80}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>💰 Total Outstanding</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{summary.activeLoansCount} active</Text>
              </View>
            </View>
            <Text style={styles.heroValue}>{formatInr(summary.outstandingAmount)}</Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroRow}>
              <View style={styles.heroCell}>
                <Text style={styles.heroCellLabel}>Total Lent</Text>
                <Text style={styles.heroCellValue}>{formatInr(summary.totalLent)}</Text>
              </View>
              <View style={styles.heroCellDivider} />
              <View style={styles.heroCell}>
                <Text style={styles.heroCellLabel}>Repaid</Text>
                <Text style={[styles.heroCellValue, { color: '#A7F3D0' }]}>
                  {formatInr(summary.totalRepaid)}
                </Text>
              </View>
              <View style={styles.heroCellDivider} />
              <View style={styles.heroCell}>
                <Text style={styles.heroCellLabel}>Overdue</Text>
                <Text style={[styles.heroCellValue, { color: '#FCA5A5' }]}>
                  {formatInr(summary.overdueAmount)}
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>
      ) : loading ? (
        <View style={styles.heroSkeleton} />
      ) : null}

      {/* Stats Grid */}
      {summary ? (
        <FadeInView delay={160}>
          <View style={styles.statsGrid}>
            <StatCard
              label="Active Loans"
              value={String(summary.activeLoansCount)}
              icon="📂"
              accent={colors.accent}
              accentLight={colors.accentLight}
              sub="pending repayment"
            />
            <StatCard
              label="Overdue"
              value={String(summary.overdueLoansCount)}
              icon="⏰"
              accent={colors.danger}
              accentLight={colors.dangerLight}
              sub="past due date"
            />
          </View>
        </FadeInView>
      ) : null}

      {/* Quick Actions */}
      <FadeInView delay={200}>
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => navigation.navigate('AddLoan')}
            style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.88 : 1 }]}>
            <Text style={styles.quickBtnIcon}>➕</Text>
            <Text style={styles.quickBtnLabel}>Add Loan</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MainTabs', { screen: 'Overview' })}
            style={({ pressed }) => [styles.quickBtn, styles.quickBtnOutline, { opacity: pressed ? 0.88 : 1 }]}>
            <Text style={styles.quickBtnIcon}>📊</Text>
            <Text style={[styles.quickBtnLabel, { color: colors.navy }]}>Overview</Text>
          </Pressable>
        </View>
      </FadeInView>

      {/* Recent Loans */}
      <FadeInView delay={260}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Loans</Text>
          <Pressable
            onPress={() => {
              // Navigate to loans - they're no longer a tab, but we can add filter from overview
              navigation.navigate('MainTabs', { screen: 'Overview' });
            }}>
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        </View>
      </FadeInView>

      {loading && !refreshing ? (
        <>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.skeletonCard, { opacity: 1 - i * 0.25 }]} />
          ))}
        </>
      ) : loans.length === 0 ? (
        <EmptyState
          title="No loans yet"
          message="Add the first amount you lent a friend. MiniLedger will keep the totals honest."
          actionLabel="Add your first loan"
          onAction={() => navigation.navigate('AddLoan')}
          icon="🤝"
        />
      ) : (
        <FadeInView delay={320}>
          {loans.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              onPress={() => navigation.navigate('LoanDetails', { loanId: loan.id })}
            />
          ))}
        </FadeInView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: { flex: 1, paddingRight: 16 },
  greeting: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginBottom: 2 },
  brandName: { fontSize: 28, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  avatarText: { color: colors.white, fontSize: 12, fontWeight: '800' },

  // Hero Card
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: 22,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#93C5FD', fontSize: 13, fontWeight: '600' },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { color: '#E0E7FF', fontSize: 12, fontWeight: '700' },
  heroValue: { color: colors.white, fontSize: 36, fontWeight: '800', marginTop: 8, letterSpacing: -1 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  heroRow: { flexDirection: 'row' },
  heroCell: { flex: 1, alignItems: 'center' },
  heroCellDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCellLabel: { color: '#BFDBFE', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  heroCellValue: { color: colors.white, fontSize: 14, fontWeight: '800', marginTop: 4 },

  // Skeleton
  heroSkeleton: {
    height: 180,
    backgroundColor: colors.border,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    opacity: 0.5,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  quickBtnOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  quickBtnIcon: { fontSize: 16 },
  quickBtnLabel: { fontSize: 14, fontWeight: '700', color: colors.white },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.accent },

  // Skeleton cards
  skeletonCard: {
    height: 100,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    marginBottom: 10,
  },
});
