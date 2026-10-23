import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

type Variant = 'primary' | 'success' | 'danger' | 'ghost' | 'accent' | 'outline';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  small?: boolean;
};

const BG: Record<Variant, string> = {
  primary: colors.navy,
  success: colors.success,
  danger: colors.danger,
  ghost: 'transparent',
  accent: colors.accent,
  outline: 'transparent',
};

const FG: Record<Variant, string> = {
  primary: colors.white,
  success: colors.white,
  danger: colors.white,
  ghost: colors.navy,
  accent: colors.white,
  outline: colors.navy,
};

export function AppButton({ title, onPress, loading, disabled, variant = 'primary', style, small }: Props) {
  const bg = BG[variant];
  const fg = FG[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: bg },
        (variant === 'ghost' || variant === 'outline') && styles.bordered,
        variant === 'outline' && { borderColor: colors.navy },
        { opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[styles.text, small && styles.smallText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  small: {
    minHeight: 38,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
  },
  bordered: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 13,
  },
});
