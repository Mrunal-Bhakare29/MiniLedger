import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ErrorBanner } from '../components/ErrorBanner';
import { colors, radius, spacing } from '../theme';
import { APP_NAME, APP_TAGLINE } from '../config';
import { sendOtp } from '../api/auth';
import { getErrorMessage } from '../utils/errors';
import type { AuthStackParamList } from '../navigation/types';

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

type Form = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const onSubmit = handleSubmit(async ({ phone }) => {
    setError(null);
    setSubmitting(true);
    animatePress();
    try {
      const result = await sendOtp(phone);
      navigation.navigate('Otp', {
        phone,
        resendSeconds: result.resendAvailableInSeconds,
        mockOtp: result.mockOtp,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Brand Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>₹</Text>
            </View>
            {/* Decorative blobs */}
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>

          {/* Feature chips */}
          <View style={styles.chips}>
            {['📋 Track loans', '⏰ Due dates', '✅ Repayments'].map((chip) => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign-in card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign in with your phone</Text>
          <Text style={styles.formSub}>
            We'll generate a 6-digit demo OTP — no SMS provider required.
          </Text>

          <ErrorBanner message={error} />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Indian Mobile Number"
                leftAddon="+91"
                keyboardType="phone-pad"
                maxLength={10}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={formState.errors.phone?.message}
                placeholder="9876543210"
                hint="Enter your 10-digit number without country code"
              />
            )}
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <AppButton
              title="Send OTP →"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting}
            />
          </Animated.View>

          <Text style={styles.legalNote}>
            By continuing, you agree to the demo terms. Loans are private to your phone number.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoText: { color: colors.white, fontSize: 40, fontWeight: '800' },
  blob: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: colors.accent,
    opacity: 0.15,
  },
  blob1: { width: 120, height: 120, top: -16, right: -16 },
  blob2: { width: 80, height: 80, bottom: -10, left: -10 },

  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: 16,
  },

  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.accent },

  // Form Card
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },
  formSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  legalNote: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});