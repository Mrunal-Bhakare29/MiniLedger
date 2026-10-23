import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  leftAddon?: string;
  hint?: string;
};

export function AppInput({ label, error, leftAddon, hint, style, onFocus, onBlur, ...rest }: Props) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = error
    ? colors.danger
    : borderAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, { borderColor }]}>
        {leftAddon ? <Text style={styles.addon}>{leftAddon}</Text> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  field: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  addon: {
    color: colors.navy,
    fontWeight: '700',
    marginRight: 8,
    fontSize: 15,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  error: {
    marginTop: 5,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  hint: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
