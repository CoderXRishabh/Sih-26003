# Smriti Backend

Backend API for the Smriti elderly dementia-care app. Node.js + Express + Prisma + PostgreSQL + Socket.io.

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** running on localhost:5432 (or configure `DATABASE_URL`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# 3. Generate Prisma client + push schema to database
npx prisma generate
npx prisma db push

# 4. Start development server
npm run dev
```

Server starts on `http://localhost:4000` by default.

---

## API Reference — curl Examples

All examples assume the server is running on `http://localhost:4000`.

### 1. Health Check

```bash
curl http://localhost:4000/health
```

---

### 2. Patient Registration

```bash
curl -X POST http://localhost:4000/auth/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kamala Devi",
    "phone": "9876543210",
    "password": "kamala123",
    "age": 72,
    "language": "as",
    "email": "kamala@example.com"
  }'
```

**Response** includes `accessToken`, `refreshToken`, and the auto-generated `careCode` (e.g., `SM-4X7B`).

---

### 3. Patient Login

```bash
curl -X POST http://localhost:4000/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "kamala123"
  }'
```

**Note:** Patient refresh token is valid for 90 days — designed for single-setup login.

---

### 4. Caregiver Registration

```bash
curl -X POST http://localhost:4000/auth/caregiver/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Ranjit Sharma",
    "email": "ranjit@clinic.com",
    "phone": "9876543211",
    "password": "ranjit2024!",
    "role": "health_worker"
  }'
```

---

### 5. Caregiver Login

```bash
curl -X POST http://localhost:4000/auth/caregiver/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ranjit@clinic.com",
    "password": "ranjit2024!"
  }'
```

---

### 6. Refresh Token

Works for both patient and caregiver tokens:

```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN_FROM_LOGIN>"
  }'
```

---

### 7. Get Care Code + QR (Patient Auth Required)

```bash
curl http://localhost:4000/patient/care-code \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

Returns `careCode` string and `qr` data URI (PNG image as base64).

---

### 8. Link Patient via Care Code (Caregiver Auth Required)

```bash
curl -X POST http://localhost:4000/caregiver/link-patient \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CAREGIVER_ACCESS_TOKEN>" \
  -d '{
    "care_code": "SM-4X7B"
  }'
```

**Rate limited:** Max 5 attempts per 15 minutes per IP.

---

### 9. List Linked Patients (Caregiver Auth Required)

```bash
curl http://localhost:4000/caregiver/patients \
  -H "Authorization: Bearer <CAREGIVER_ACCESS_TOKEN>"
```

---

### 10. Unlink Patient (Caregiver Auth Required)

```bash
curl -X DELETE http://localhost:4000/caregiver/unlink/1 \
  -H "Authorization: Bearer <CAREGIVER_ACCESS_TOKEN>"
```

---

### 11. Log Activity (Patient Auth Required)

```bash
# Game score
curl -X POST http://localhost:4000/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -d '{
    "type": "game",
    "payload": { "game": "match_pairs", "score": 4, "time_seconds": 45 }
  }'

# Mood check-in
curl -X POST http://localhost:4000/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -d '{
    "type": "mood_checkin",
    "payload": { "mood": "happy", "note": "Had a good morning walk" }
  }'
```

**Real-time:** This also emits a Socket.io event to any caregiver watching this patient.

---

### 12. Get Patient Activity (Caregiver Auth Required, Link-Guarded)

```bash
curl http://localhost:4000/caregiver/patients/1/activity \
  -H "Authorization: Bearer <CAREGIVER_ACCESS_TOKEN>"
```

Returns 403 if caregiver does not have an active link to this patient.

---

### 13. Patient Reminders

```bash
# List reminders
curl http://localhost:4000/patient/reminders \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"

# Create reminder
curl -X POST http://localhost:4000/patient/reminders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>" \
  -d '{
    "type": "medicine",
    "label": "Take morning pills",
    "scheduled_time": "9:00 AM"
  }'

# Mark reminder complete
curl -X PATCH http://localhost:4000/patient/reminders/1/complete \
  -H "Authorization: Bearer <PATIENT_ACCESS_TOKEN>"
```

---

### 14. Get Patient Reminders as Caregiver (Link-Guarded)

```bash
curl http://localhost:4000/caregiver/patients/1/reminders \
  -H "Authorization: Bearer <CAREGIVER_ACCESS_TOKEN>"
```

---

## Socket.io — Real-time Events

### Connecting

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000/care", {
  auth: { token: "<ACCESS_TOKEN>" },
});
```

### Events

| Event | Direction | Data | Description |
|---|---|---|---|
| `activity:new` | Server → Caregiver | `{ id, patientId, type, payload, createdAt }` | New patient activity logged |
| `reminder:completed` | Server → Caregiver | `{ reminderId, patientId, completedAt }` | Patient completed a reminder |
| `subscribe:patient` | Caregiver → Server | `patientId: number` | Manually join a patient's room |
| `unsubscribe:patient` | Caregiver → Server | `patientId: number` | Leave a patient's room |

### Room Auto-Join

When a **caregiver** connects, the server automatically joins them into `patient:{id}` rooms for every actively-linked patient. No manual subscription needed for existing links.

---

## Database Management

```bash
# Open Prisma Studio (visual DB browser)
npx prisma studio

# Create a migration
npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ destructive)
npx prisma migrate reset
```

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma         — 5 tables: patients, caregivers, links, activity_logs, reminders
├── src/
│   ├── index.ts              — Express + Socket.io server bootstrap
│   ├── config/
│   │   └── env.ts            — Environment variables
│   ├── middleware/
│   │   ├── auth.ts           — verifyPatientToken, verifyCaregiverToken
│   │   ├── rateLimiter.ts    — Rate limits for link-patient + auth
│   │   └── errorHandler.ts   — Global error handler
│   ├── routes/
│   │   ├── authPatient.ts    — Patient register + login
│   │   ├── authCaregiver.ts  — Caregiver register + login
│   │   ├── authRefresh.ts    — Token refresh
│   │   ├── patient.ts        — Care Code, reminders
│   │   ├── caregiver.ts      — Link, patients list, unlink, patient data
│   │   └── activity.ts       — Activity logging + socket emit
│   ├── services/
│   │   ├── auth.ts           — JWT + bcrypt
│   │   ├── careCode.ts       — Care Code gen + QR
│   │   └── linkGuard.ts      — Verifies active caregiver-patient link
│   ├── socket/
│   │   └── index.ts          — Socket.io namespace + rooms
│   └── utils/
│       └── validation.ts     — Zod schemas
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```
