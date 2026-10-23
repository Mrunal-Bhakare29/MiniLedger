import { query } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { asCount, asMoney } from '../../utils/money';
import { escapeIlike } from '../../utils/search';

export type LoanRow = {
  id: string;
  user_id: string;
  friend_name: string;
  amount: string;
  due_date: string;
  status: 'active' | 'repaid';
  repaid_at: Date | null;
  receipt_path: string | null;
  created_at: Date;
  updated_at: Date;
  is_overdue: boolean;
};

export function serializeLoan(row: LoanRow) {
  return {
    id: row.id,
    friendName: row.friend_name,
    amount: asMoney(row.amount),
    dueDate: String(row.due_date).slice(0, 10),
    status: row.status,
    repaidAt: row.repaid_at ? new Date(row.repaid_at).toISOString() : null,
    hasReceipt: Boolean(row.receipt_path),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    isOverdue: row.status === 'active' && Boolean(row.is_overdue),
  };
}

const LOAN_SELECT = `
  SELECT
    id,
    user_id,
    friend_name,
    amount::text AS amount,
    due_date::text AS due_date,
    status,
    repaid_at,
    receipt_path,
    created_at,
    updated_at,
    (status = 'active' AND due_date < CURRENT_DATE) AS is_overdue
  FROM loans
`;

export async function createLoan(
  userId: string,
  input: { friendName: string; amount: string; dueDate: string },
) {
  const inserted = await query<{ id: string }>(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, status)
     VALUES ($1, $2, $3::numeric, $4::date, 'active')
     RETURNING id`,
    [userId, input.friendName, input.amount, input.dueDate],
  );
  return (await getLoan(userId, inserted.rows[0].id)).dto;
}

export async function listLoans(
  userId: string,
  filters: { search: string; status: 'all' | 'active' | 'overdue' | 'repaid'; order: 'asc' | 'desc' },
) {
  const search = escapeIlike(filters.search);
  const order = filters.order === 'desc' ? 'DESC' : 'ASC';
  const result = await query<LoanRow>(
    `${LOAN_SELECT}
     WHERE user_id = $1
       AND ($2 = '' OR friend_name ILIKE '%' || $2 || '%' ESCAPE '\\')
       AND (
         $3 = 'all'
         OR ($3 = 'active' AND status = 'active')
         OR ($3 = 'repaid' AND status = 'repaid')
         OR ($3 = 'overdue' AND status = 'active' AND due_date < CURRENT_DATE)
       )
     ORDER BY due_date ${order}, created_at DESC`,
    [userId, search, filters.status],
  );
  return result.rows.map(serializeLoan);
}

export async function getLoan(userId: string, loanId: string) {
  const result = await query<LoanRow>(`${LOAN_SELECT} WHERE id = $1 AND user_id = $2`, [loanId, userId]);
  const loan = result.rows[0];
  if (!loan) {
    throw new AppError(404, 'Loan not found');
  }
  return { row: loan, dto: serializeLoan(loan) };
}

export async function repayLoan(userId: string, loanId: string) {
  const current = await getLoan(userId, loanId);
  if (current.row.status === 'repaid') {
    throw new AppError(409, 'This loan is already marked as repaid');
  }

  const updated = await query<{ id: string }>(
    `UPDATE loans
     SET status = 'repaid', repaid_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'active'
     RETURNING id`,
    [loanId, userId],
  );
  if (!updated.rows[0]) {
    throw new AppError(409, 'This loan is already marked as repaid');
  }
  return (await getLoan(userId, loanId)).dto;
}

export async function deleteLoan(userId: string, loanId: string) {
  const result = await query('DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING id', [loanId, userId]);
  if ((result.rowCount ?? 0) === 0) {
    throw new AppError(404, 'Loan not found');
  }
}

export async function saveReceiptPath(userId: string, loanId: string, receiptPath: string) {
  await getLoan(userId, loanId);
  await query(
    `UPDATE loans
     SET receipt_path = $3, updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [loanId, userId, receiptPath],
  );
  return (await getLoan(userId, loanId)).dto;
}

export async function getSummary(userId: string) {
  const result = await query<{
    total_lent: string;
    total_repaid: string;
    outstanding_amount: string;
    overdue_amount: string;
    active_loans_count: string;
    overdue_loans_count: string;
    repaid_loans_count: string;
  }>(
    `SELECT
       COALESCE(SUM(amount), 0)::text AS total_lent,
       COALESCE(SUM(amount) FILTER (WHERE status = 'repaid'), 0)::text AS total_repaid,
       COALESCE(SUM(amount) FILTER (WHERE status = 'active'), 0)::text AS outstanding_amount,
       COALESCE(SUM(amount) FILTER (WHERE status = 'active' AND due_date < CURRENT_DATE), 0)::text AS overdue_amount,
       COUNT(*) FILTER (WHERE status = 'active')::text AS active_loans_count,
       COUNT(*) FILTER (WHERE status = 'active' AND due_date < CURRENT_DATE)::text AS overdue_loans_count,
       COUNT(*) FILTER (WHERE status = 'repaid')::text AS repaid_loans_count
     FROM loans
     WHERE user_id = $1`,
    [userId],
  );

  const row = result.rows[0];
  return {
    totalLent: asMoney(row.total_lent),
    totalRepaid: asMoney(row.total_repaid),
    outstandingAmount: asMoney(row.outstanding_amount),
    overdueAmount: asMoney(row.overdue_amount),
    activeLoansCount: asCount(row.active_loans_count),
    overdueLoansCount: asCount(row.overdue_loans_count),
    repaidLoansCount: asCount(row.repaid_loans_count),
  };
}
