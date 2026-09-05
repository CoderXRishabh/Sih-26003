# Smriti — App Data Reference

Complete technical and product reference for the Smriti dementia-care app. Any agent reading this file should be able to understand the entire app without reading source code.

---

## 1. Product Overview

**Smriti** is a mobile-first dementia care companion app for elderly users in Northeast India (Assam & Manipur). It has two distinct portals:

- **Patient portal** — simple, large-text UI for elderly users. Memory games, reminders, mood check-in, daily chit chat, AI companion (Smriti).
- **Caregiver portal** — admin-style dashboard for doctors/family caregivers to monitor patient activity, reminders, mood, and chit chat responses.

**Design language:** Warm cream backgrounds (`#FAF6EF` → `#F5EFE4`), teal primary (`#2E6F6E`), ochre accent (`#D9A441`), terracotta alert (`#C1613D`), sage success (`#7A9B76`), purple chit-chat (`#8B5CA8`). Font: Atkinson Hyperlegible Next (Google Fonts). Rounded corners (16px+), 64px+ touch targets, max 4 elements per screen, bamboo-weave SVG strip decorations.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin, no config file) |
| State | React `useState` + `useContext` (no Redux/Zustand) |
| Backend | Node.js + Express + Prisma ORM + PostgreSQL + Socket.io (in `/backend`) |
| Auth & Data | JWT tokens (in `localStorage`), dynamic API endpoints via `src/api.ts` |
| Fonts | Google Fonts CSS2 `@import` in `src/index.css` |
| Assets | Vite ES module imports (`import foo from "@/imports/foo.png"`) |

**Entry points:**
- `index.html` → `src/main.tsx` → `src/App.tsx` (all components in one file)
- `src/index.css` — Tailwind import + global font wiring + keyframe animations

---

## 3. File Structure

```
src/
  App.tsx          — ALL components, types, constants, screens (2600+ lines)
  index.css        — Tailwind import, font wiring, BambooStrip pattern, mic-pulse keyframe
  main.tsx         — React root mount
  imports/
    ChatGPT_Image_Sep_4__2026__05_05_52_PM.png  — Match Pairs game thumbnail
appdata.md         — This file
AGENTS.md          — Project structure guide for agents
```

---

## 4. Design Tokens (src/index.css `@theme`)

```css
--color-bg:             #FAF6EF
--color-ink:            #2B2B2B
--color-primary:        #2E6F6E   /* teal */
--color-primary-light:  #3D8F8E
--color-primary-muted:  #EBF4F4
--color-accent:         #D9A441   /* ochre */
--color-accent-muted:   #FDF3E0
--color-alert:          #C1613D   /* terracotta */
--color-alert-muted:    #FAF0EC
--color-success:        #7A9B76   /* sage */
--color-success-muted:  #EEF4EE
--color-border:         #D6C9B4
```

Purple (chit chat): `#8B5CA8` / muted `#F3EDF8` — not in theme tokens, used inline.

---

## 5. Global Types

```ts
type Lang = "en" | "as" | "mn"

type Screen =
  | "auth" | "onboarding" | "home"
  | "games" | "game"
  | "reminders" | "smriti" | "chitchat" | "profile"
  | "caregiver-login" | "caregiver-dashboard"

type UserProfile = { name: string; email: string; phone: string; age: string }

type Patient = { id: number; patientId: string; name: string; age: number; email: string; active: boolean }

type AuthRole = "user" | "caregiver"
type AuthStep = "role" | "form"
type AuthFormMode = "login" | "register"
type CaregiverTab = "patients" | "alerts" | "profile"
type ChatMsg = { from: "smriti" | "user"; text: string }
type ChatEntry = { from: "smriti" | "user"; text: string }
type MoodReply = "Happy 😊" | "Tired 😴" | "Need help 🙏" | null
```

---

## 6. Context & Hooks

### `LangContext`
```ts
createContext<{ lang: Lang; setLang: (l: Lang) => void }>
```
- Provided by `App` root
- Consumed via `useLang()` hook

### `UserContext`
```ts
createContext<{ user: UserProfile; setUser: (u: UserProfile) => void }>
```
- Provided by `App` root
- Consumed via `useUser()` hook
- Initialised from `localStorage` on mount

### `useT()` — translation hook
```ts
function useT(): (key: string) => string
```
Returns a `t(key)` function that looks up `TRANSLATIONS[key][lang]`, falls back to `"en"`, then to the key itself.

### `useTime()` — live clock
Returns a `Date` object updated every second via `setInterval`.

---

## 7. i18n — TRANSLATIONS keys

All keys have `en`, `as` (Assamese), `mn` (Manipuri) values.

| Key | English value |
|---|---|
| `chooseLanguage` | Choose your language |
| `continue` | Continue → |
| `goodMorning` | Good morning |
| `goodAfternoon` | Good afternoon |
| `goodEvening` | Good evening |
| `playRemember` | Play & Remember |
| `memoryGames` | Memory game |
| `myReminders` | My Reminders |
| `medicineMeals` | Medicine & meals |
| `talkSmriti` | Talk to Smriti |
| `aiCompanion` | Your AI care companion |
| `callFamily` | Call Family |
| `familyNames` | Ananya & Ranjit |
| `todayReminders` | Today's Reminders |
| `seeAll` | See all → |
| `takeMedicine` | Take Medicine |
| `drinkWater` | Drink Water |
| `lunch` | Lunch |
| `doctorAppt` | Doctor Appointment |
| `navHome` | Home |
| `navPlay` | Play |
| `navReminders` | Reminders |
| `navSettings` | Settings |
| `matchPairs` | Match the Pairs |
| `doingGreat` | You're doing great! |
| `needHint` | Need a hint? |
| `hintUsed` | Hint used |
| `playAgain` | Play again |
| `tapSpeak` | Tap to speak |
| `listening` | Listening… |
| `startOver` | Start over |
| `howFeeling` | How are you feeling today? |
| `happy` | Happy 😊 |
| `tired` | Tired 😴 |
| `needHelp` | Need help 🙏 |
| `chitChat` | Daily Chit Chat |
| `chitChatSub` | Chat with Smriti |
| `chitChatTitle` | Daily Chit Chat |
| `nextQuestion` | Next question → |
| `wellDone` | Well done! 🌿 |
| `allDone` | That's all for today! |
| `chatAgain` | Chat again |
| `caregiverLogin` | Caregiver Login |
| `emailAddress` | Email address |
| `password` | Password |
| `login` | Login |
| `loginOtp` | Login with OTP instead |

---

## 8. localStorage Keys

| Key | Type | Purpose |
|---|---|---|
| `smriti_logged_in` | `"1"` | Whether a user is logged in |
| `smriti_role` | `"user"` \| `"caregiver"` | Which portal to open on return |
| `smriti_user_name` | string | User's full name |
| `smriti_user_email` | string | User's email |
| `smriti_user_phone` | string | User's phone number |
| `smriti_user_age` | string | User's age |

**Note:** App currently always starts at `"auth"` screen on refresh (dev mode). To re-enable skip-to-home for returning users, restore the localStorage check in `App()`.

---

## 9. Navigation Flow

```
"auth"
  ├── User role  → "onboarding" → "home"
  └── Caregiver  → "caregiver-dashboard"

Patient screens (inside shell with bottom nav):
  "home" → "games" → "game" (back → "games")
  "home" → "reminders"
  "home" → "smriti"
  "home" → "chitchat"
  "home" → "profile" (profile button top-right of hero)

Caregiver screens (standalone, no bottom nav):
  "caregiver-dashboard" (tabs: patients / alerts / profile)
    └── Logout → "auth"
```

Bottom nav tabs (patient): **Home**, **Play** (→ games), **Reminders**

---

## 10. Screens Reference

### `OnboardingScreen`
- Language selection: Assamese, Manipuri, + "More languages" placeholder (disabled)
- SVG hero with `অ` (teal) and `ম` (ochre) script characters
- Stores language in `LangContext`
- Props: `onContinue: () => void`

### `LoginRegisterScreen` + `AuthForm`
- Step 1: Role picker — "I am a User" (teal) / "I am a Caregiver" (ochre)
- Step 2: `AuthForm` — Login/Register tab switcher, name/email/password fields
- On submit: saves to `localStorage`, calls `onDone(role, name, email)`
- Props: `onDone: (role: AuthRole, name: string, email: string) => void`

### `HomeScreen`
- Teal gradient hero band with bamboo leaf SVGs
- Left: greeting (time-based) + user's real name from `UserContext`
- Right: language dropdown pill + profile button (shows user initials when name set)
- "Talk to Smriti" white card CTA → navigates to `"smriti"`
- 3 home cards: Play & Remember (`"games"`), Daily Chit Chat (`"chitchat"`), Call Family (no-op)
- Today's reminders inline list (from `REMINDERS_INIT`, first 3 items)
- Props: `onNavigate: (s: Screen) => void`, `onSettings: () => void`

### `GamesScreen`
- 2-column card grid, each card: thumbnail image (65%) + game name (35%)
- Match the Pairs — available, uses imported PNG thumbnail
- Number Sequence, Word Association, Spot the Difference — locked (coming soon)
- Props: `onNavigate: (s: Screen) => void`, `onBack: () => void`

### `MemoryGameScreen`
- 4×2 grid of 8 cards (4 pairs), NE India themed icons: tea cup, bamboo basket, flower, leaf, bird, fish
- Tap to flip, auto-checks pairs, hint button (shows one pair briefly)
- Completion state with user's name ("Wonderful, [name]!")
- Props: `onBack: () => void`

### `RemindersScreen`
- Full list of `REMINDERS_INIT` reminders
- Tap to toggle done/undone
- Props: `onBack: () => void`

### `SmritiScreen`
- Smriti avatar SVG (woman in teal with bindi)
- Mood check-in: Happy / Tired / Need help (tappable bubbles)
- Chat bubble UI, pre-set replies from `SMRITI_REPLIES`
- Props: `onBack: () => void`

### `ChitChatScreen`
- 5 personal daily questions from `CHIT_CHAT_QUESTIONS`
- 4 tappable answer options per question (2×2 grid)
- Chat bubble thread with Smriti avatar
- Progress dots at top
- Completion state with "Chat again" reset
- Props: `onBack: () => void`

### `ProfileScreen`
- Shows avatar with initials, name, email, phone, age from `UserContext`
- View mode + Edit mode (saves to `UserContext` + `localStorage`)
- Sign out button → calls `onLogout`
- Props: `onBack: () => void`, `onLogout: () => void`

### `CaregiverDashboard`
- Standalone full-screen (no patient bottom nav)
- Teal header with "Smriti Care — Caregiver Portal" + Logout button
- Three tabs: **My Patients**, **Alerts**, **Profile**
- **My Patients tab:**
  - Horizontal scroll patient chip strip at top (name initials + first name)
  - "Add patient" chip → opens `AddPatientModal`
  - Patient overview: 2×2 stat grid (Cognitive, Games, Chit Chat, Reminders Missed)
  - Mood today (Happy/Tired/Needs Help) with timestamp
  - Today's Reminders list (mirrors `REMINDERS_INIT`)
  - Chit Chat Answers preview
  - Weekly Activity bar chart
  - Recent Alerts list
- **Alerts tab:** Full list of `ALERTS`
- **Profile tab:** Caregiver name/org/role + Sign out
- Props: `onLogout: () => void`

### `AddPatientModal`
- Modal overlay with Patient ID + Email fields
- On submit: adds new patient to state (name derived from email prefix)
- Props: `onClose: () => void`, `onAdd: (pid: string, email: string) => void`

---

## 11. Key Constants

### `REMINDERS_INIT`
```ts
[
  { id: 1, time: "9:00 AM",  labelKey: "takeMedicine", icon: "pill",     color: "#C1613D", bg: "#FAF0EC", done: true  },
  { id: 2, time: "11:00 AM", labelKey: "drinkWater",   icon: "droplet",  color: "#2E6F6E", bg: "#EBF4F4", done: false },
  { id: 3, time: "1:00 PM",  labelKey: "lunch",        icon: "bowl",     color: "#D9A441", bg: "#FDF3E0", done: false },
  { id: 4, time: "4:00 PM",  labelKey: "doctorAppt",   icon: "calendar", color: "#7A9B76", bg: "#EEF4EE", done: false },
]
```

### `PATIENTS_INIT`
5 dummy patients: Kamala Devi (SMR-001), Rajan Sharma (SMR-002), Meena Borah (SMR-003), Dilip Gogoi (SMR-004), Sarita Nath (SMR-005). All have `patientId`, `name`, `age`, `email`, `active`.

### `CHIT_CHAT_QUESTIONS` (5 questions)
1. What did you enjoy most this morning? (options: tea, walk, quiet time, family time)
2. What is your favourite season? (Spring / Summer / Autumn / Winter)
3. When young, favourite food? (Rice & fish / Pitha / Dal & roti / Sweet rice)
4. Who makes you smile? (Children / Friends / Grandchildren / Neighbour)
5. What sound do you love waking up to? (Birds / Rain / Temple bells / Silence)

### `SMRITI_REPLIES`
```ts
{ happy: "...", tired: "...", needHelp: "..." }
```
Keyed by mood selection from SmritiScreen.

### `ALERTS`
```ts
[
  { id: 1, type: "alert", text: "Missed medicine at 9:00 AM" },
  { id: 2, type: "ok",    text: "Completed memory game" },
  { id: 3, type: "alert", text: "No activity detected after 3 PM" },
]
```

### `GAME_ICONS` (memory game)
6 NE India themed SVG icon components: `IconTeaCup`, `IconBambooBasket`, `IconFlower`, `IconLeaf`, `IconBird`, `IconFish`. Each paired to make 4 pairs from 8 cards.

---

## 12. Reusable UI Components

| Component | Purpose |
|---|---|
| `BambooStrip` | Thin SVG bamboo culm pattern strip (top/bottom of screens) |
| `NavBar` | Screen header with optional back chevron + title |
| `OfflineBanner` | Yellow sync status banner (shown in caregiver dashboard) |
| `SmritiOrb` | Circular teal orb with Smriti face (used on home screen CTA) |
| `SmritiAvatar` | Larger Smriti face SVG (used in SmritiScreen) |
| `CaregiverIllustration` | Two-figure SVG illustration (used in onboarding) |
| `MiniLineChart` | Inline SVG sparkline chart (cognitive score trend) |
| `WeeklyBarChart` | Inline SVG 7-bar chart (weekly activity) |
| `ReminderIcon` | Switches between pill/droplet/bowl/calendar icons |

### Filled icon components (white SVG for coloured circular badges on home cards)
`FilledIconPuzzle`, `FilledIconBell`, `FilledIconMic`, `FilledIconPhone`, `FilledIconChat`

### Outline icon components
`IconMic`, `IconPuzzle`, `IconBell`, `IconPhone`, `IconSettings`, `IconCloud`, `IconCheck`, `IconVolume`, `IconChevronLeft`, `IconPill`, `IconDroplet`, `IconBowl`, `IconCalendar`

---

## 13. App Shell (`export default function App`)

```tsx
// State
const [screen, setScreen] = useState<Screen>("auth")
const [lang, setLang] = useState<Lang>("en")
const [user, setUserState] = useState<UserProfile>  // loaded from localStorage

// Providers
<LangContext.Provider value={{ lang, setLang }}>
<UserContext.Provider value={{ user, setUser }}>

// Full-screen (no bottom nav):
"auth"                → <LoginRegisterScreen>
"onboarding"          → <OnboardingScreen>
"caregiver-dashboard" → <CaregiverDashboard>

// Patient shell (with bottom nav):
"home"     → <HomeScreen>
"games"    → <GamesScreen>
"game"     → <MemoryGameScreen>
"reminders"→ <RemindersScreen>
"smriti"   → <SmritiScreen>
"chitchat" → <ChitChatScreen>
"profile"  → <ProfileScreen>
```

**Patient bottom nav:** Home (`"home"`), Play (`"games"`), Reminders (`"reminders"`)

**`handleLogout()`:** Removes `smriti_logged_in` and `smriti_role` from localStorage, sets screen to `"auth"`.

---

## 14. Assets

| File | Import name | Used in |
|---|---|---|
| `src/imports/ChatGPT_Image_Sep_4__2026__05_05_52_PM.png` | `matchPairsThumbnail` | `GamesScreen` — Match Pairs card thumbnail |

---

## 15. Known Dev Behaviour

- App **always starts at `"auth"`** on refresh (hardcoded for development). To restore skip-for-returning-users, reinstate the `localStorage.getItem("smriti_logged_in")` check in `App()`.
- All data is **mock/static** — no API calls, no database. Patient stats, alerts, chit chat answers in the caregiver dashboard are hardcoded.
- Language switching is real-time via `LangContext` — all screens re-render with translated strings immediately.
- Stale Vite bundle errors (e.g. `ReferenceError: X is not defined`) are always resolved by a **hard refresh** (`Cmd+Shift+R`), not code changes.
- `CaregiverLoginScreen` component still exists in code but is **unreachable** — caregiver auth now flows through `LoginRegisterScreen`.

---

## 16. Adding a New Screen (checklist)

1. Add the screen name to `type Screen` union
2. Create the screen component (use `NavBar` + `BambooStrip` for patient screens)
3. Wire it in `App` render — full-screen flows or inside the patient shell block
4. Add a navigation trigger (home card, nav tab, or button in another screen)
5. Add any new translation keys to `TRANSLATIONS` with `en`/`as`/`mn` values

## 17. Adding a New Game (checklist)

1. Add an entry to the `GAMES` array inside `GamesScreen` with `locked: false`
2. Provide a thumbnail image (import as ES module, add to `src/imports/`)
3. Add the screen name to `type Screen`
4. Build the game component
5. Wire it in the `App` shell and in `GamesScreen`'s `onClick`
