import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { colors, radius, shadows, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { fetchSummary } from '../api/loans';
import { APP_NAME, APP_TAGLINE, API_BASE_URL } from '../config';
import type { LoanSummary } from '../types';
import { formatInr } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

function SettingsRow({
  icon,
  label,
  sub,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        settingsStyles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={settingsStyles.iconWrap}>
        <Text style={settingsStyles.icon}>{icon}</Text>
      </View>
      <View style={settingsStyles.labelWrap}>
        <Text style={[settingsStyles.label, destructive && { color: colors.danger }]}>{label}</Text>
        {sub ? <Text style={settingsStyles.sub}>{sub}</Text> : null}
      </View>
      {onPress ? (
        <Text style={[settingsStyles.arrow, destructive && { color: colors.danger }]}>›</Text>
      ) : null}
    </Pressable>
  );
}

const settingsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  labelWrap: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  arrow: { fontSize: 20, color: colors.textMuted, fontWeight: '300' },
});

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const s = await fetchSummary();
      setSummary(s);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmLogout = () => {
    Alert.alert(
      'Log Out?',
      'You will need to verify your phone number again to sign in.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const displayPhone = user?.displayPhone ?? '';
  const initial = displayPhone ? displayPhone.slice(-2) : '?';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Avatar + phone */}
      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.phoneLabel}>My Account</Text>
        <Text style={styles.phone}>{displayPhone || '—'}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified</Text>
        </View>
      </View>

      <ErrorBanner message={error} />

      {/* Account Stats */}
      {summary && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Account Summary</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Active Loans"
              value={String(summary.activeLoansCount)}
              icon="📂"
              accent={colors.accent}
              accentLight={colors.accentLight}
            />
            <StatCard
              label="Total Lent"
              value={formatInr(summary.totalLent)}
              icon="💸"
              accent={colors.navy}
              accentLight={colors.accentLight}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="Outstanding"
              value={formatInr(summary.outstandingAmount)}
              icon="⏳"
              accent={colors.warning}
              accentLight={colors.warningLight}
            />
            <StatCard
              label="Total Repaid"
              value={formatInr(summary.totalRepaid)}
              icon="✅"
              accent={colors.success}
              accentLight={colors.successLight}
            />
          </View>
        </View>
      )}

      {/* Settings */}
      <Text style={styles.sectionTitle}>Settings</Text>
      <Card style={styles.settingsCard}>
        <SettingsRow
          icon="📱"
          label="Phone Number"
          sub={displayPhone}
        />
        <SettingsRow
          icon="ℹ️"
          label="About MiniLedger"
          sub={APP_TAGLINE}
        />
        <SettingsRow
          icon="🔒"
          label="Privacy"
          sub="Your loans are private and only accessible to you"
        />
        <SettingsRow
          icon="🌐"
          label="API Server"
          sub={API_BASE_URL}
        />
        <SettingsRow
          icon="🚪"
          label="Log Out"
          sub="Sign out from this device"
          onPress={confirmLogout}
          destructive
        />
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerBrand}>
          <Text style={styles.footerBrandText}>₹</Text>
        </View>
        <Text style={styles.footerName}>{APP_NAME}</Text>
        <Text style={styles.footerTagline}>{APP_TAGLINE}</Text>
        <Text style={styles.footerNote}>Demo mock OTP — not production SMS auth</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },

  // Profile header
  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.card,
  },
  avatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  phoneLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  phone: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    marginTop: 8,
    backgroundColor: colors.successLight,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },

  // Stats
  statsSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  // Settings
  settingsCard: { marginBottom: 24, padding: 0 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  footerBrand: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  footerBrandText: { color: colors.white, fontSize: 20, fontWeight: '800' },
  footerName: { fontSize: 16, fontWeight: '800', color: colors.navy },
  footerTagline: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', maxWidth: 220 },
  footerNote: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
