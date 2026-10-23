export type User = {
  id: string;
  phone: string;
  displayPhone: string;
  createdAt: string;
};

export type LoanStatus = 'active' | 'repaid';

export type Loan = {
  id: string;
  friendName: string;
  amount: string;
  dueDate: string;
  status: LoanStatus;
  repaidAt: string | null;
  hasReceipt: boolean;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
};

export type LoanSummary = {
  totalLent: string;
  totalRepaid: string;
  outstandingAmount: string;
  overdueAmount: string;
  activeLoansCount: number;
  overdueLoansCount: number;
  repaidLoansCount: number;
};

export type LoanFilter = 'all' | 'active' | 'overdue' | 'repaid';
