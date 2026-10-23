import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import * as controller from './loans.controller';
import { receiptUpload } from './receipts';

export const loansRouter = Router();

loansRouter.use(requireAuth);

loansRouter.post('/', asyncHandler(controller.createLoan));
loansRouter.get('/', asyncHandler(controller.listLoans));
loansRouter.get('/summary', asyncHandler(controller.getSummary));
loansRouter.get('/:id', asyncHandler(controller.getLoan));
loansRouter.patch('/:id/repay', asyncHandler(controller.repayLoan));
loansRouter.delete('/:id', asyncHandler(controller.deleteLoan));
loansRouter.post('/:id/receipt', receiptUpload.single('receipt'), asyncHandler(controller.uploadReceipt));
loansRouter.get('/:id/receipt', asyncHandler(controller.downloadReceipt));
