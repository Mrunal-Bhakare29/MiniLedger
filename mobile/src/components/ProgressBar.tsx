import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  label: string;
  value: number; // 0 to 1
  fillColor: string;
  leftLabel?: string;
  rightLabel?: string;
};

export function ProgressBar({ label, value, fillColor, leftLabel, rightLabel }: Props) {
  const pct = Math.min(Math.max(value, 0), 1);
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.pct, { color: fillColor }]}>{Math.round(pct * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
      </View>
      {(leftLabel || rightLabel) && (
        <View style={styles.sub}>
          {leftLabel ? <Text style={styles.subText}>{leftLabel}</Text> : null}
          {rightLabel ? <Text style={styles.subText}>{rightLabel}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  pct: { fontSize: 13, fontWeight: '800' },
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  sub: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  subText: { fontSize: 11, color: colors.textSecondary },
});
