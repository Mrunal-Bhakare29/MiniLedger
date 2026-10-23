import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '../theme';

type Props = {
  label: string;
  value: string;
  icon: string;
  accent: string;
  accentLight: string;
  sub?: string;
};

export function StatCard({ label, value, icon, accent, accentLight, sub }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accentLight }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: { fontSize: 20 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    minHeight: 28,
  },
  sub: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
