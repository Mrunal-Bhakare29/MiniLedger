# MiniLedger

**Lend smart. Track simply. Get repaid.**

MiniLedger is a full-stack personal lending tracker. You log money you lent to friends, see who still owes you, mark loans repaid, and watch live totals calculated in PostgreSQL.

This project is an internship assignment. Phone login uses a **development mock OTP**, not real SMS. Never use this authentication design in production.

## What you can do

- Sign in with an Indian mobile number and a 6-digit OTP printed in the backend terminal
- Create, list, search, filter, and sort loans
- Mark a loan repaid (with confirmation) and optionally delete it
- See live totals: total lent, total repaid, outstanding, overdue
- Optionally attach a receipt image (JPEG, PNG, or WebP, max 5 MB)
- Keep a demo session on the phone until you log out

## Why PostgreSQL

PostgreSQL is the real database. It stores users and loans on your computer.

- **users**: one row per phone number
- **loans**: one row per amount you lent, always tied to `user_id`
- Money uses `NUMERIC(12,2)` so `2500.00 + 3000.00` stays exact. JavaScript `number` is a poor fit for money.
- Summary totals are `SUM` / `COUNT` queries. They are never hardcoded.

A loan due **today** is not overdue. A **repaid** loan is never overdue.

## Architecture

```
MiniLedger (this folder)
  backend/     Express + TypeScript API
  mobile/      React Native CLI app (not Expo)
  README.md
```

### Backend flow

1. The phone calls `POST /api/auth/send-otp`.
2. The server creates a cryptographically random 6-digit OTP, stores only a hash, and prints the code in the terminal when `MOCK_OTP_ENABLED=true`.
3. `POST /api/auth/verify-otp` checks the hash, expires old codes, then returns a JWT.
4. Loan routes read the user id from that JWT. The app cannot choose another user’s id.

### Mobile flow

1. Axios attaches the JWT from AsyncStorage.
2. Home, Loans, Add Loan, and Profile are bottom tabs.
3. Login, OTP, and loan details are stack screens.
4. After create/repay, screens reload from the API so the dashboard stays in sync.

## Prerequisites (Windows)

Already verified on this machine during setup:

- Node.js v24.x and npm
- Git
- JDK 17
- Android SDK (`ANDROID_HOME`)
- PostgreSQL 18 service `postgresql-x64-18` **running** and listening on port 5432

You still need:

- The **postgres** user password (the one you chose when PostgreSQL was installed)
- Android Studio emulator or a physical Android phone with USB debugging

pgAdmin 4 was **not** found in the usual install folders. You can still create databases with the script below, or install pgAdmin later if you prefer a GUI.

## 1. Create the databases (private password)

The API cannot log in to PostgreSQL until you enter your password **on your PC**. Do not paste that password into chat.

Open **Command Prompt**:

```cmd
cd C:\Project\backend
npm run setup:db
```

The script asks for the `postgres` password (hidden), then:

- creates `miniledger_db` (app data)
- creates `miniledger_test` (Jest only)
- writes `backend\.env` on disk (gitignored)

### Manual option (pgAdmin or psql)

1. Open pgAdmin 4 if you have it, connect to PostgreSQL, right-click **Databases** → **Create** → **Database**.
2. Name it `miniledger_db`. Repeat for `miniledger_test`.
3. Copy `backend\.env.example` to `backend\.env`.
4. Replace `YOUR_PASSWORD` yourself. If the password contains `@`, `#`, `/`, or spaces, URL-encode it.
5. Set a long random `JWT_SECRET` (16+ characters).

Connection shape:

```text
postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger_db
```

If `psql` is not on PATH, the full path is:

```text
"C:\Program Files\PostgreSQL\18\bin\psql.exe"
```

## 2. Backend setup

```cmd
cd C:\Project\backend
npm install
npm run migrate
npm run dev
```

You should see:

```text
MiniLedger API listening on http://localhost:5000
```

Check health in a browser: `http://localhost:5000/api/health`

### How to get the development OTP

1. Keep the backend terminal visible.
2. In the app, enter a valid 10-digit Indian mobile number (starts with 6–9) and tap **Send OTP**.
3. The terminal prints a line like:

```text
[MiniLedger][DEV OTP] +919876543210 => 482193
```

4. Type that code in the app. The HTTP response never includes the OTP.

OTPs expire after 5 minutes, can be resent after 60 seconds, and are locked after 5 wrong guesses. A used OTP cannot be reused.

## 3. Mobile setup

```cmd
cd C:\Project\mobile
npm install
```

Start Metro, then the Android app (use two terminals):

```cmd
cd C:\Project\mobile
npm start
```

```cmd
cd C:\Project\mobile
npm run android
```

The emulator must use `http://10.0.2.2:5000` (already set in `mobile/src/config.ts`). `localhost` inside Android is **not** your Windows PC.

### Physical phone

1. Put the PC and phone on the same Wi-Fi.
2. Run `ipconfig` and copy the IPv4 address, for example `192.168.1.24`.
3. Change `API_BASE_URL` in `mobile/src/config.ts` to `http://192.168.1.24:5000`.
4. Allow inbound TCP port **5000** in Windows Defender Firewall for private networks.
5. Rebuild the app.

PostgreSQL should stay bound to localhost. Only the Node API is exposed to the phone.

## API examples

Replace `TOKEN` with the JWT from verify-otp.

```cmd
curl -X POST http://localhost:5000/api/auth/send-otp -H "Content-Type: application/json" -d "{\"phone\":\"9876543210\"}"

curl -X POST http://localhost:5000/api/auth/verify-otp -H "Content-Type: application/json" -d "{\"phone\":\"9876543210\",\"otp\":\"123456\"}"

curl http://localhost:5000/api/auth/me -H "Authorization: Bearer TOKEN"

curl -X POST http://localhost:5000/api/loans -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"friendName\":\"Rahul\",\"amount\":\"2500.00\",\"dueDate\":\"2026-11-15\"}"

curl "http://localhost:5000/api/loans?status=active&search=Rahul" -H "Authorization: Bearer TOKEN"

curl http://localhost:5000/api/loans/summary -H "Authorization: Bearer TOKEN"

curl -X PATCH http://localhost:5000/api/loans/LOAN_ID/repay -H "Authorization: Bearer TOKEN"

curl -X DELETE http://localhost:5000/api/loans/LOAN_ID -H "Authorization: Bearer TOKEN"
```

Receipt upload:

```cmd
curl -X POST http://localhost:5000/api/loans/LOAN_ID/receipt -H "Authorization: Bearer TOKEN" -F "receipt=@C:\path\to\receipt.jpg"
```

Summary fields (values always come from SQL):

```json
{
  "totalLent": "10000.00",
  "totalRepaid": "3000.00",
  "outstandingAmount": "7000.00",
  "overdueAmount": "2000.00",
  "activeLoansCount": 3,
  "overdueLoansCount": 1,
  "repaidLoansCount": 2
}
```

## Tests

Tests use **`miniledger_test` only**. They refuse to run against `miniledger_db`.

```cmd
cd C:\Project\backend
npm test
```

Covered behaviour:

- OTP send, invalid OTP, expired OTP, successful login
- Loan validation failures
- Owner isolation (another user gets 404)
- Repayment and duplicate repayment
- Empty summaries
- Loans due today are not overdue
- Repaid loans are excluded from overdue totals

```cmd
cd C:\Project\mobile
npm test
```

## Environment variables

See `backend/.env.example`. Important keys:

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | App database |
| `TEST_DATABASE_URL` | Isolated test database |
| `JWT_SECRET` | Signs login tokens |
| `MOCK_OTP_ENABLED` | Prints OTP in the terminal in development |
| `UPLOAD_DIR` | Local folder for demo receipts |
| `MAX_UPLOAD_BYTES` | 5 MB default |

Never commit `.env`, secrets, `node_modules`, or uploaded receipts.

## Security limitations (read this)

- Mock OTP is **not** SMS. Anyone who can read the backend terminal can log in as that demo number.
- Receipts are stored on local disk. That is fine for a demo, not for production object storage or access control at scale.
- HTTP is used on the local network. Production apps should use HTTPS.
- JWT is a simple signed token. There is no refresh-token rotation.
- Rate limits are basic and in-database / per-phone, not a full abuse platform.

## Troubleshooting

**password authentication failed**  
Run `npm run setup:db` again with the correct postgres password, or edit `backend\.env` privately.

**database "miniledger_db" does not exist**  
Create it with the setup script or pgAdmin, then `npm run migrate`.

**Cannot reach the MiniLedger server**  
Start `npm run dev` first. On the emulator, keep `10.0.2.2`. On a phone, use the PC LAN IP and open firewall port 5000.

**OTP not in the API response**  
That is intentional. Look at the backend terminal. Confirm `MOCK_OTP_ENABLED=true`.

**Android build tools / SDK errors**  
Open Android Studio, install a recent emulator image, set `ANDROID_HOME` to `C:\Users\<you>\AppData\Local\Android\Sdk`.

**psql is not recognized**  
Use `"C:\Program Files\PostgreSQL\18\bin\psql.exe"` or the `setup:db` script, which already uses that path.

## Folder map

```
backend/src/config          env + PostgreSQL pool
backend/src/middleware      JWT auth + errors
backend/src/modules/auth    mock OTP login
backend/src/modules/loans   loans, summary, receipts
backend/src/utils           money, phone, OTP hashing
backend/migrations         SQL schema
backend/tests              Jest + Supertest
mobile/src/api              Axios client
mobile/src/components       reusable UI
mobile/src/context          session
mobile/src/navigation       tabs + stacks
mobile/src/screens          all app screens
```
