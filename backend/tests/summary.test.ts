import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/db';
import { auth, loginAs, resetTestDatabase } from './helpers';

const PHONE = '9988776655';

beforeAll(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('financial summary', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('returns zeros for an empty account', async () => {
    const { token } = await loginAs(PHONE);
    const res = await request(app).get('/api/loans/summary').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalLent: '0.00',
      totalRepaid: '0.00',
      outstandingAmount: '0.00',
      overdueAmount: '0.00',
      activeLoansCount: 0,
      overdueLoansCount: 0,
      repaidLoansCount: 0,
    });
  });

  it('calculates totals from PostgreSQL, including overdue and repaid rules', async () => {
    const { token } = await loginAs(PHONE);
    const today = await pool.query<{ d: string }>('SELECT CURRENT_DATE::text AS d');
    const todayDate = today.rows[0].d;

    await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Future',
      amount: '10000.00',
      dueDate: '2099-01-15',
    });
    await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Overdue',
      amount: '2000.00',
      dueDate: '2020-01-10',
    });
    const repaid = await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Paid',
      amount: '3000.00',
      dueDate: '2020-01-10',
    });
    await request(app).patch(`/api/loans/${repaid.body.loan.id}/repay`).set(auth(token));
    await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Due Today',
      amount: '500.00',
      dueDate: todayDate,
    });

    const res = await request(app).get('/api/loans/summary').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.totalLent).toBe('15500.00');
    expect(res.body.totalRepaid).toBe('3000.00');
    expect(res.body.outstandingAmount).toBe('12500.00');
    expect(res.body.overdueAmount).toBe('2000.00');
    expect(res.body.activeLoansCount).toBe(3);
    expect(res.body.overdueLoansCount).toBe(1);
    expect(res.body.repaidLoansCount).toBe(1);
  });

  it('does not count a loan due today as overdue', async () => {
    const { token } = await loginAs(PHONE);
    const today = await pool.query<{ d: string }>('SELECT CURRENT_DATE::text AS d');
    await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Today Only',
      amount: '750.25',
      dueDate: today.rows[0].d,
    });
    const res = await request(app).get('/api/loans/summary').set(auth(token));
    expect(res.body.overdueAmount).toBe('0.00');
    expect(res.body.overdueLoansCount).toBe(0);
    expect(res.body.outstandingAmount).toBe('750.25');
  });

  it('never counts a repaid loan as overdue', async () => {
    const { token } = await loginAs(PHONE);
    const created = await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Old Debt',
      amount: '400.00',
      dueDate: '2019-05-01',
    });
    await request(app).patch(`/api/loans/${created.body.loan.id}/repay`).set(auth(token));
    const res = await request(app).get('/api/loans/summary').set(auth(token));
    expect(res.body.overdueAmount).toBe('0.00');
    expect(res.body.overdueLoansCount).toBe(0);
    expect(res.body.totalRepaid).toBe('400.00');
  });
});
