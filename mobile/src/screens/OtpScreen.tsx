import React, { useEffect, useRef, useState } from 'react';
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
import { sendOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import type { AuthStackParamList } from '../navigation/types';

const schema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP'),
});

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;
type OtpForm = z.infer<typeof schema>;

export function OtpScreen({ route }: Props) {
  const { phone, resendSeconds } = route.params;
  const [mockOtp, setMockOtp] = useState(route.params.mockOtp);
  const { login } = useAuth();

  const [seconds, setSeconds] = useState(resendSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entrance animation
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  const { control, handleSubmit, formState, reset } = useForm<OtpForm>({
    resolver: zodResolver(schema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((v) => v - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const onSubmit = handleSubmit(async ({ otp }) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, otp);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  const onResend = async () => {
    if (seconds > 0 || resending) return;
    setError(null);
    setResending(true);
    try {
      const result = await sendOtp(phone);
      setSeconds(result.resendAvailableInSeconds);
      setMockOtp(result.mockOtp);
      reset({ otp: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = `+91 ${'X'.repeat(6)}${phone.slice(-4)}`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>📲</Text>
            </View>
            <Text style={styles.heading}>Verify your number</Text>
            <Text style={styles.subheading}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phone}>{maskedPhone}</Text>
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <ErrorBanner message={error} />

            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="6-Digit OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={formState.errors.otp?.message}
                  placeholder="123456"
                  hint="Check the OTP card below if you're in development mode"
                />
              )}
            />

            <AppButton
              title="Verify & Continue →"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting}
            />

            {/* Resend section */}
            <View style={styles.resendRow}>
              <Text style={styles.resendHint}>
                {seconds > 0 ? `Resend available in ${seconds}s` : "Didn't receive the code?"}
              </Text>
              <AppButton
                title="Resend OTP"
                variant="ghost"
                onPress={onResend}
                disabled={seconds > 0 || resending}
                loading={resending}
                small
              />
            </View>
          </View>

          {/* Dev OTP Card */}
          {mockOtp ? (
            <View style={styles.devCard}>
              <View style={styles.devHeader}>
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeText}>DEV</Text>
                </View>
                <Text style={styles.devLabel}>Development OTP</Text>
              </View>
              <Text selectable style={styles.devOtp}>
                {mockOtp}
              </Text>
              <Text style={styles.devHint}>
                🔒 This code is only visible in local development mode and is never returned in production.
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // Icon section
  iconSection: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phone: {
    fontWeight: '700',
    color: colors.navy,
  },

  // Form card
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    marginBottom: 16,
  },

  resendRow: { marginTop: 14, gap: 6 },
  resendHint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // Dev OTP card
  devCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
  },
  devHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  devBadge: {
    backgroundColor: '#16A34A',
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  devBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  devLabel: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  devOtp: {
    fontSize: 34,
    fontWeight: '800',
    color: '#14532D',
    letterSpacing: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  devHint: { fontSize: 12, color: '#16A34A', textAlign: 'center', lineHeight: 18 },
});