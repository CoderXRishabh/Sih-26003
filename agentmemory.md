# Agent Memory — Smriti Chit Chat Feature

## Current Task
Building a Multilingual Voice Chit-Chat Quiz with Caregiver Dashboard for the Smriti dementia-care app.

## Key Context

### Project Stack
- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4, all components in `src/App.tsx` (2319 lines)
- **Backend**: Express + Prisma + SQLite + Socket.io, in `backend/`
- **Auth**: JWT (patient + caregiver), middleware in `backend/src/middleware/auth.ts`
- **Design**: Warm cream bg, teal primary `#2E6F6E`, purple chit-chat `#8B5CA8`, Atkinson Hyperlegible font

### Audio Files Location
`src/Questions in all three language/` with 3 subdirectories:
- `english/` — 10 MP3 files (questions 1-10)
- `assamese/` — 10 MP3 files (questions 1-10)
- `manipuri/` — 10 MP3 files (questions 1-10)

### Question Bank (10 questions, mapped from audio filenames)
1. How much water did you drink today?
2. Who visited you or talked to you today?
3. What colour are your clothes?
4. What did you spend most your time doing today?
5. What food did you like today?
6. Where did you keep something important today?
7. What did you do just before this quiz?
8. What was your favourite thing today?
9. What did your favourite thing today? (likely: What was your favourite thing to do today?)
10. Did you see anything that made you happy today?

### Existing ChitChatScreen (to be replaced)
- Located at lines 1193-1257 in `src/App.tsx`
- Simple text-only, 3 hardcoded questions, tap-through flow
- Needs to become voice-based with 5 randomly selected questions from bank of 10

### Existing CaregiverDashboard (to be enhanced)
- Located at lines 1907-2147 in `src/App.tsx`
- Currently has: patient selector strip, reminders, activity stream
- Needs: new "Chats Analysis" tab + enhanced "Alerts" tab with AI-generated alerts

### API Architecture
- Patient routes: `/patient/*` (verifyPatientToken middleware)
- Caregiver routes: `/caregiver/*` (verifyCaregiverToken middleware)
- Activity logging: `/activity` (patient token)
- New: `/chitchat/*` (patient token) + caregiver chitchat routes

### External APIs Needed
- **Groq API** (`whisper-large-v3-turbo`) for speech-to-text
- **NVIDIA Nemotron 3 Ultra** for AI report generation
- Both API keys to be stored in `backend/.env`

### Database
- SQLite (via Prisma), file at `backend/prisma/dev.db`
- Existing models: Patient, Caregiver, PatientCaregiverLink, ActivityLog, Reminder
- New models needed: ChitChatSession, ChitChatResponse, ChitChatReport

### i18n
- Languages: `en` (English), `as` (Assamese), `mn` (Manipuri/Meitei)
- All translations in `TRANSLATIONS` object in `App.tsx` (lines 10-68)
- `useLang()` hook + `useT()` translation hook

## Memory Log
- **2026-09-05 12:49**: Initialized agent memory file
- **2026-09-05 13:16**: Full codebase research completed. Created implementation plan.
  - Explored all existing code: App.tsx, backend routes, Prisma schema, auth, socket.io
  - Mapped audio file structure in `src/Questions in all three language/`
  - Identified existing ChitChatScreen (L1193-1257) and CaregiverDashboard (L1907-2147)
  - Plan covers: 3 new DB models, 2 new backend services, 6 new API routes, redesigned frontend screens
- **2026-09-05 15:07**: Restored the complete 1st version UI inside the dedicated Chit-Chat Analysis screen:
  - 3 Summary Stat Cards: Mood & Sentiment Score (`/10`), Speech & Response Depth (`words / answer`), and Safety Assessment (`LOW RISK` / `ALERTS`).
  - Key AI Takeaways Box: Clinical insights & observations (`summaryBullets`).
  - Conversation Theme Tags: Hashtag pills & Theme Frequency Distribution Bar Chart (`ThemeBarChart`).
  - Spoken Session Transcripts Breakdown: Session headers with date, time, total sessions, and exact question vs transcribed audio answer pairs.
  - Verified 100% clean TypeScript compilation with 0 errors.
