import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoanRow } from '../components/LoanRow';
import { colors, radius } from '../theme';
import { fetchLoans } from '../api/loans';
import type { Loan, LoanFilter } from '../types';
import { getErrorMessage } from '../utils/errors';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';

const FILTERS: { id: LoanFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'repaid', label: 'Repaid' },
];

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Loans'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function LoansScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LoanFilter>('all');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchLoans({ search, status, order: 'asc' });
      setLoans(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const emptyTitle = useMemo(() => {
    if (search) {
      return 'No matching friends';
    }
    return 'No loans in this filter';
  }, [search]);

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by friend name"
          placeholderTextColor={colors.muted}
          style={styles.search}
        />
      </View>
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => setStatus(filter.id)}
            style={[styles.chip, status === filter.id && styles.chipOn]}>
            <Text style={[styles.chipText, status === filter.id && styles.chipTextOn]}>{filter.label}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorBanner message={error} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy} />
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LoanRow loan={item} onPress={() => navigation.navigate('LoanDetails', { loanId: item.id })} />
          )}
          ListEmptyComponent={<EmptyState title={emptyTitle} message="Try another filter or add a new loan." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12 },
  searchWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  search: { minHeight: 48, paddingHorizontal: 14, color: colors.text, fontSize: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.muted, fontWeight: '700' },
  chipTextOn: { color: colors.white },
  list: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
