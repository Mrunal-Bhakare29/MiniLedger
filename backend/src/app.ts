import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './modules/auth/auth.routes';
import { loansRouter } from './modules/loans/loans.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { pool } from './config/db';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({
    ok: true,
    service: 'MiniLedger API',
    mockOtp: process.env.MOCK_OTP_ENABLED === 'true',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/loans', loansRouter);

app.use(notFoundHandler);
app.use(errorHandler);
