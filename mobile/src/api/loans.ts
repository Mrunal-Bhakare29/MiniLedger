import { api } from './client';
import type { Loan, LoanFilter, LoanSummary } from '../types';

export async function fetchSummary() {
  const { data } = await api.get<LoanSummary>('/api/loans/summary');
  return data;
}

export async function fetchLoans(params: { search?: string; status?: LoanFilter; order?: 'asc' | 'desc' } = {}) {
  const { data } = await api.get<{ loans: Loan[] }>('/api/loans', { params });
  return data.loans;
}

export async function fetchLoan(id: string) {
  const { data } = await api.get<{ loan: Loan }>(`/api/loans/${id}`);
  return data.loan;
}

export async function createLoan(payload: { friendName: string; amount: string; dueDate: string }) {
  const { data } = await api.post<{ loan: Loan }>('/api/loans', payload);
  return data.loan;
}

export async function repayLoan(id: string) {
  const { data } = await api.patch<{ loan: Loan }>(`/api/loans/${id}/repay`);
  return data.loan;
}

export async function deleteLoan(id: string) {
  await api.delete(`/api/loans/${id}`);
}

export async function uploadReceipt(id: string, uri: string, type: string, fileName: string) {
  const form = new FormData();
  form.append('receipt', {
    uri,
    type,
    name: fileName,
  } as unknown as Blob);
  const { data } = await api.post<{ loan: Loan }>(`/api/loans/${id}/receipt`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data.loan;
}
