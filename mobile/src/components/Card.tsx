import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows } from '../theme';

type CardProps = ViewProps & {
  variant?: 'default' | 'navy' | 'accent' | 'success' | 'warning';
  noPadding?: boolean;
};

export function Card({ style, children, variant = 'default', noPadding, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'navy' && styles.navyCard,
        variant === 'accent' && styles.accentCard,
        variant === 'success' && styles.successCard,
        variant === 'warning' && styles.warningCard,
        noPadding && styles.noPadding,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  navyCard: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  accentCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  successCard: {
    backgroundColor: colors.successLight,
    borderColor: '#C3E8D8',
  },
  warningCard: {
    backgroundColor: colors.warningLight,
    borderColor: '#F5D9A0',
  },
  noPadding: {
    padding: 0,
  },
});
