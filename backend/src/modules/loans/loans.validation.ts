import { z } from 'zod';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const moneyPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

function isRealCalendarDate(value: string): boolean {
  const match = isoDate.exec(value);
  if (!match) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const createLoanSchema = z.object({
  friendName: z
    .string({ required_error: 'Friend name is required' })
    .trim()
    .min(2, 'Friend name must be at least 2 characters')
    .max(80, 'Friend name must be 80 characters or less'),
  amount: z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .refine((value) => moneyPattern.test(value), 'Amount must be a positive number with up to 2 decimal places')
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero')
    .refine((value) => Number(value) <= 9999999999.99, 'Amount is too large'),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .trim()
    .refine((value) => isoDate.test(value), 'Due date must use YYYY-MM-DD')
    .refine(isRealCalendarDate, 'Due date must be a real calendar date'),
});

export const listLoansQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  status: z.enum(['all', 'active', 'overdue', 'repaid']).optional().default('all'),
  sort: z.enum(['due_date']).optional().default('due_date'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const loanIdParamsSchema = z.object({
  id: z.string().uuid('Invalid loan id'),
});
