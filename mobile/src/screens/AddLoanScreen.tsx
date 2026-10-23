import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Card } from '../components/Card';

// Safely resolve native DateTimePicker without crashing JS evaluation if binary is unlinked
let NativeDateTimePicker: any = null;
let NativeDateTimePickerAndroid: any = null;
try {
  const pickerModule = require('@react-native-community/datetimepicker');
  NativeDateTimePicker = pickerModule.default;
  NativeDateTimePickerAndroid = pickerModule.DateTimePickerAndroid;
} catch {
  NativeDateTimePicker = null;
  NativeDateTimePickerAndroid = null;
}
import { ErrorBanner } from '../components/ErrorBanner';
import { colors, radius, shadows, spacing } from '../theme';
import { createLoan, uploadReceipt } from '../api/loans';
import { getErrorMessage } from '../utils/errors';
import { formatDate, toIsoDate } from '../utils/format';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';

const schema = z.object({
  friendName: z
    .string()
    .trim()
    .min(2, "Enter the friend's name (at least 2 characters)")
    .max(80, 'Name is too long'),
  amount: z
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/, 'Use a positive amount with up to 2 decimals')
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a due date'),
});

type Form = z.infer<typeof schema>;
type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'AddLoan'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function AddLoanScreen({ navigation }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ uri: string; type: string; fileName: string } | null>(null);

  const { control, handleSubmit, setValue, watch, formState, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { friendName: '', amount: '', dueDate: toIsoDate(new Date()) },
  });

  const dueDate = watch('dueDate');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const onDate = (event: any, date?: Date) => {
    setShowPicker(false);
    if (event?.type !== 'dismissed' && date) {
      setValue('dueDate', toIsoDate(date), { shouldValidate: true });
    }
  };

  const openDatePicker = () => {
    const currentDate = new Date(`${dueDate}T00:00:00`);
    if (Platform.OS === 'android' && NativeDateTimePickerAndroid?.open) {
      try {
        NativeDateTimePickerAndroid.open({
          value: currentDate,
          onChange: onDate,
          mode: 'date',
          minimumDate: new Date(),
        });
        return;
      } catch (err) {
        console.warn('Native Android date picker unavailable, opening modal picker', err);
      }
    }
    if (Platform.OS === 'ios' && NativeDateTimePicker) {
      setShowPicker(true);
      return;
    }
    setShowCustomModal(true);
  };

  const pickReceipt = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    setReceipt({
      uri: asset.uri,
      type: asset.type ?? 'image/jpeg',
      fileName: asset.fileName ?? `receipt-${Date.now()}.jpg`,
    });
  };

  const removeReceipt = () => setReceipt(null);

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const loan = await createLoan(values);
      if (receipt) {
        await uploadReceipt(loan.id, receipt.uri, receipt.type, receipt.fileName);
      }
      setSuccess(true);
      reset({ friendName: '', amount: '', dueDate: toIsoDate(new Date()) });
      setReceipt(null);
      // Brief success moment then navigate
      setTimeout(() => {
        setSuccess(false);
        navigation.navigate('LoanDetails', { loanId: loan.id });
      }, 900);
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.headerIcon}>🤝</Text>
          <Text style={styles.title}>New Loan</Text>
          <Text style={styles.subtitle}>Track money you lend to a friend</Text>
        </View>

        {/* Success Banner */}
        {success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ Loan saved successfully!</Text>
          </View>
        )}

        <ErrorBanner message={error} />

        {/* Form Card */}
        <Card style={styles.formCard}>
          <Controller
            control={control}
            name="friendName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Friend's Name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={formState.errors.friendName?.message}
                placeholder="e.g. Rahul Sharma"
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Loan Amount (INR)"
                leftAddon="₹"
                keyboardType="decimal-pad"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={formState.errors.amount?.message}
                placeholder="2500.00"
                hint="Use up to 2 decimal places"
              />
            )}
          />

          {/* Due Date */}
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Pressable
              onPress={openDatePicker}
              style={({ pressed }) => [styles.dateBtn, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
              <Text style={styles.dateCaret}>›</Text>
            </Pressable>
            {formState.errors.dueDate ? (
              <Text style={styles.dateError}>{formState.errors.dueDate.message}</Text>
            ) : null}
            {/* Native Date Picker if supported */}
            {showPicker && Platform.OS !== 'android' && NativeDateTimePicker ? (
              <NativeDateTimePicker
                value={new Date(`${dueDate}T00:00:00`)}
                mode="date"
                onChange={onDate}
                minimumDate={new Date()}
              />
            ) : null}
          </View>
        </Card>

        {/* Fallback Date Picker Modal for web/unlinked dev builds */}
        <Modal
          visible={showCustomModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCustomModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCustomModal(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Select Due Date</Text>
              <Text style={styles.modalSub}>Choose a repayment deadline</Text>

              <View style={styles.quickDatesGrid}>
                {[
                  { label: 'Today', days: 0 },
                  { label: '+7 Days', days: 7 },
                  { label: '+15 Days', days: 15 },
                  { label: '+30 Days', days: 30 },
                  { label: '+60 Days', days: 60 },
                  { label: '+90 Days', days: 90 },
                ].map((item) => {
                  const target = new Date();
                  target.setDate(target.getDate() + item.days);
                  const iso = toIsoDate(target);
                  const isSelected = dueDate === iso;
                  return (
                    <Pressable
                      key={item.label}
                      style={[
                        styles.quickDateBtn,
                        isSelected && styles.quickDateBtnActive,
                      ]}
                      onPress={() => {
                        setValue('dueDate', iso, { shouldValidate: true });
                        setShowCustomModal(false);
                      }}>
                      <Text
                        style={[
                          styles.quickDateBtnText,
                          isSelected && styles.quickDateBtnTextActive,
                        ]}>
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.quickDateBtnSub,
                          isSelected && styles.quickDateBtnSubActive,
                        ]}>
                        {formatDate(iso)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <AppButton
                title="Done"
                variant="primary"
                onPress={() => setShowCustomModal(false)}
                style={styles.modalCloseBtn}
              />
            </Pressable>
          </Pressable>
        </Modal>

        {/* Receipt Card */}
        <Card style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptIconWrap}>
              <Text style={styles.receiptIcon}>🧾</Text>
            </View>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptTitle}>
                {receipt ? '✓ Receipt attached' : 'Attach Receipt'}
              </Text>
              <Text style={styles.receiptSub}>
                {receipt ? receipt.fileName : 'Optional — JPEG, PNG up to 5 MB'}
              </Text>
            </View>
          </View>
          <View style={styles.receiptBtns}>
            <AppButton
              title={receipt ? 'Change Image' : 'Choose Image'}
              variant="outline"
              onPress={pickReceipt}
              small
              style={styles.receiptBtn}
            />
            {receipt && (
              <AppButton
                title="Remove"
                variant="ghost"
                onPress={removeReceipt}
                small
                style={styles.receiptBtn}
              />
            )}
          </View>
        </Card>

        {/* Submit */}
        <AppButton
          title={submitting ? 'Saving…' : 'Save Loan'}
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting || success}
          style={styles.submitBtn}
        />

        <AppButton
          title="💡 Amount format help"
          variant="ghost"
          onPress={() =>
            Alert.alert(
              'Loan Amount',
              'Enter the rupee amount with up to two decimal places.\n\nExamples:\n• 500\n• 2500.00\n• 10000.50',
            )
          }
          style={styles.helpBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },

  pageHeader: { alignItems: 'center', marginBottom: 20 },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  successBanner: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#B2DFC8',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  successText: { color: colors.success, fontWeight: '700', fontSize: 15 },

  formCard: { marginBottom: 14 },

  dateSection: { marginBottom: 8 },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  dateIcon: { fontSize: 16 },
  dateText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
  dateCaret: { fontSize: 18, color: colors.textMuted },
  dateError: { marginTop: 5, color: colors.danger, fontSize: 12, fontWeight: '500' },

  receiptCard: { marginBottom: 14 },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  receiptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptIcon: { fontSize: 22 },
  receiptInfo: { flex: 1 },
  receiptTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  receiptSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  receiptBtns: { flexDirection: 'row', gap: 8 },
  receiptBtn: { flex: 1 },

  submitBtn: { marginBottom: 10 },
  helpBtn: { marginBottom: 20 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickDatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickDateBtn: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickDateBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  quickDateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  quickDateBtnTextActive: {
    color: colors.white,
  },
  quickDateBtnSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickDateBtnSubActive: {
    color: colors.white,
    opacity: 0.9,
  },
  modalCloseBtn: {
    marginTop: 4,
  },
});
