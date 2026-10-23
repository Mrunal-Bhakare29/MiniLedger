import type { Request, Response } from 'express';
import { createLoanSchema, listLoansQuerySchema, loanIdParamsSchema } from './loans.validation';
import * as loanService from './loans.service';
import { AppError } from '../../utils/AppError';
import { assertSafeStoredImage, resolveOwnedReceipt, toPublicReceiptName } from './receipts';

function currentUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'Please log in to continue');
  }
  return req.user.id;
}

export async function createLoan(req: Request, res: Response) {
  const body = createLoanSchema.parse(req.body);
  const loan = await loanService.createLoan(currentUserId(req), body);
  res.status(201).json({ loan });
}

export async function listLoans(req: Request, res: Response) {
  const query = listLoansQuerySchema.parse(req.query);
  const loans = await loanService.listLoans(currentUserId(req), query);
  res.status(200).json({ loans });
}

export async function getSummary(req: Request, res: Response) {
  const summary = await loanService.getSummary(currentUserId(req));
  res.status(200).json(summary);
}

export async function getLoan(req: Request, res: Response) {
  const params = loanIdParamsSchema.parse(req.params);
  const { dto } = await loanService.getLoan(currentUserId(req), params.id);
  res.status(200).json({ loan: dto });
}

export async function repayLoan(req: Request, res: Response) {
  const params = loanIdParamsSchema.parse(req.params);
  const loan = await loanService.repayLoan(currentUserId(req), params.id);
  res.status(200).json({ loan });
}

export async function deleteLoan(req: Request, res: Response) {
  const params = loanIdParamsSchema.parse(req.params);
  await loanService.deleteLoan(currentUserId(req), params.id);
  res.status(204).send();
}

export async function uploadReceipt(req: Request, res: Response) {
  const params = loanIdParamsSchema.parse(req.params);
  if (!req.file) {
    throw new AppError(400, 'Please choose a receipt image');
  }
  const safePath = assertSafeStoredImage(req.file.path);
  const storedName = toPublicReceiptName(safePath);
  const loan = await loanService.saveReceiptPath(currentUserId(req), params.id, storedName);
  res.status(200).json({ loan });
}

export async function downloadReceipt(req: Request, res: Response) {
  const params = loanIdParamsSchema.parse(req.params);
  const { row } = await loanService.getLoan(currentUserId(req), params.id);
  if (!row.receipt_path) {
    throw new AppError(404, 'No receipt has been uploaded for this loan');
  }
  const absolute = resolveOwnedReceipt(row.receipt_path);
  res.sendFile(absolute);
}
