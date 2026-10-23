import path from 'path';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/db';
import { auth, loginAs, resetTestDatabase } from './helpers';

const USER_A = '9876543210';
const USER_B = '9123456789';
const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

beforeAll(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('loan APIs', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('creates a loan and lists it for the owner', async () => {
    const { token } = await loginAs(USER_A);
    const created = await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Rahul',
      amount: '2500.00',
      dueDate: '2026-11-15',
    });
    expect(created.status).toBe(201);
    expect(created.body.loan.amount).toBe('2500.00');
    expect(created.body.loan.status).toBe('active');

    const list = await request(app).get('/api/loans').set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body.loans).toHaveLength(1);
    expect(list.body.loans[0].friendName).toBe('Rahul');
  });

  it('rejects invalid create-loan payloads', async () => {
    const { token } = await loginAs(USER_A);
    const missing = await request(app).post('/api/loans').set(auth(token)).send({});
    expect(missing.status).toBe(400);

    const badAmount = await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Rahul',
      amount: '-10',
      dueDate: '2026-11-15',
    });
    expect(badAmount.status).toBe(400);

    const badDate = await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Rahul',
      amount: '10.00',
      dueDate: '2026-13-40',
    });
    expect(badDate.status).toBe(400);
  });

  it('isolates loans by owner and blocks unauthorized access', async () => {
    const a = await loginAs(USER_A);
    const b = await loginAs(USER_B);
    const created = await request(app).post('/api/loans').set(auth(a.token)).send({
      friendName: 'Private Friend',
      amount: '100.00',
      dueDate: '2026-11-15',
    });
    const loanId = created.body.loan.id as string;

    const listB = await request(app).get('/api/loans').set(auth(b.token));
    expect(listB.body.loans).toHaveLength(0);

    const detailB = await request(app).get(`/api/loans/${loanId}`).set(auth(b.token));
    expect(detailB.status).toBe(404);

    const repayB = await request(app).patch(`/api/loans/${loanId}/repay`).set(auth(b.token));
    expect(repayB.status).toBe(404);

    const deleteB = await request(app).delete(`/api/loans/${loanId}`).set(auth(b.token));
    expect(deleteB.status).toBe(404);

    const noAuth = await request(app).get('/api/loans');
    expect(noAuth.status).toBe(401);
  });

  it('marks a loan repaid once and rejects a duplicate repayment', async () => {
    const { token } = await loginAs(USER_A);
    const created = await request(app).post('/api/loans').set(auth(token)).send({
      friendName: 'Anita',
      amount: '3000.00',
      dueDate: '2026-12-01',
    });
    const loanId = created.body.loan.id as string;
    const repaid = await request(app).patch(`/api/loans/${loanId}/repay`).set(auth(token));
    expect(repaid.status).toBe(200);
    expect(repaid.body.loan.status).toBe('repaid');
    expect(repaid.body.loan.repaidAt).toBeTruthy();

    const again = await request(app).patch(`/api/loans/${loanId}/repay`).set(auth(token));
    expect(again.status).toBe(409);
  });

  it('uploads a receipt only for the owner', async () => {
    const a = await loginAs(USER_A);
    const b = await loginAs(USER_B);
    const created = await request(app).post('/api/loans').set(auth(a.token)).send({
      friendName: 'Receipt Friend',
      amount: '50.00',
      dueDate: '2026-11-15',
    });
    const loanId = created.body.loan.id as string;
    const pngPath = path.join(__dirname, 'tiny.png');
    const fs = await import('fs');
    fs.writeFileSync(pngPath, Buffer.from(PNG_1PX, 'base64'));

    const stolen = await request(app)
      .post(`/api/loans/${loanId}/receipt`)
      .set(auth(b.token))
      .attach('receipt', pngPath);
    expect(stolen.status).toBe(404);

    const ok = await request(app)
      .post(`/api/loans/${loanId}/receipt`)
      .set(auth(a.token))
      .attach('receipt', pngPath);
    expect(ok.status).toBe(200);
    expect(ok.body.loan.hasReceipt).toBe(true);
    fs.unlinkSync(pngPath);
  });
});
