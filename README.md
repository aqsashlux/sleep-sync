**Language: English | [Español](README.es.md) | [Português](README.pt.md) | [中文](README.zh.md)**

# Sleep Sync

A desktop app that helps you gradually fix your sleep schedule using circadian phase advance techniques.

![Sleep Sync](sync.png)

## The Problem

If you naturally fall asleep at 3 AM and wake up at noon, you're not broken. You have a late chronotype -- a biological variation where your internal clock runs offset from conventional schedules. Millions of people deal with this: developers who code best at 2 AM, gamers who find their flow when everyone else is asleep, shift workers transitioning between day and night rotations, or anyone with Delayed Sleep Phase Syndrome (DSPS).

The usual advice -- "just go to bed earlier" -- fails about 80% of the time because your circadian rhythm resists abrupt changes. It's like forcing yourself into permanent jet lag.

## The Science

Your circadian rhythm is regulated by the suprachiasmatic nucleus, a cluster of neurons that responds to light, temperature, meal timing, and melatonin. Trying to shift your sleep by 3 hours overnight fights against all of these signals at once.

**Phase advance** works differently: instead of a single large shift, you move your schedule earlier by 30-60 minutes every few days, alternating with consolidation days where you hold steady. This gives your internal clock time to recalibrate without the stress of social jet lag. Clinical studies show gradual phase advance has success rates above 80%, compared to less than 20% for abrupt changes.

## How It Works

Sleep Sync implements this as a daily plan:

1. You set your current sleep/wake times and your target schedule.
2. On **advance days**, the app shifts your target bedtime earlier by a configurable amount (30-50 min).
3. On **hold days**, you maintain the current schedule to let your body consolidate.
4. The app tracks **9 energy phases** throughout the day relative to your wake time (sleep inertia, morning peak, post-lunch dip, wind-down, etc.) so you know what to expect from your body at each hour.

You can force any specific date to be a hold or advance day, and confirm advance completions with built-in checks.

## Who It's For

- **Developers & night owls** -- shift your deep focus window to a more functional hour without losing it
- **Gamers & streamers** -- align your peak performance with your streaming schedule
- **People with DSPS** -- a structured, medication-free approach to moving your sleep window
- **Shift workers** -- reduce circadian disruption when rotating between day and night shifts

## Tech Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Lucide React         |
| Backend  | Express 5, better-sqlite3 (WAL mode)                   |
| Auth     | Google OAuth 2.0 (react-oauth/google + google-auth-library), JWT |
| i18n     | i18next, react-i18next, browser language detection      |
| Desktop  | Electron 33, electron-builder (NSIS installer)          |
| Testing  | Node.js built-in test runner (node:test), 72 tests      |

## Getting Started

### Prerequisites

- **Node.js 20+** (uses `--env-file` flag; 24+ recommended)
- A **Google OAuth Client ID** from [Google Cloud Console](https://console.cloud.google.com/)

### Google OAuth Setup

1. Go to Google Cloud Console > APIs & Services > Credentials.
2. Create an **OAuth 2.0 Client ID** (Web application type).
3. Under **Authorized JavaScript origins**, add `http://localhost:5173`.
4. Copy the Client ID for the next step.

### Installation

```bash
git clone https://github.com/aqsashlux/sleep-sync.git
cd sleep-sync
npm install
```

Create a `.env` file in the project root with your values:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com  # same value
JWT_SECRET=any-long-random-string
PORT=3001  # optional, defaults to 3001
```

### Running

Open two terminals:

```bash
# Terminal 1 -- Backend (port 3001)
node --env-file=.env server.js

# Terminal 2 -- Frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with your Google account, or click **Try without an account** to use guest mode (data stored locally only).

## Commands

| Command                           | Description                       |
|-----------------------------------|-----------------------------------|
| `npm run dev`                     | Start Vite dev server             |
| `node --env-file=.env server.js`  | Start Express backend             |
| `npm run build`                   | Production build                  |
| `npm run electron:build:win`      | Build Windows desktop app (NSIS)  |
| `npm run lint`                    | Run ESLint                        |
| `node --test tests/*.test.js`    | Run all 72 tests                  |
| `node db/migrate.js`             | Migrate legacy db.json to SQLite  |

## Project Structure

```
sleep-sync/
├── server.js              # Express orchestrator (~35 lines)
├── config.js              # Centralized config (ports, DB path, JWT, OAuth)
├── db/
│   ├── schema.sql         # SQLite DDL (4 tables)
│   ├── database.js        # SQLite init + getDB() singleton
│   └── migrate.js         # db.json -> SQLite migration
├── middleware/
│   └── auth.js            # requireAuth + optionalAuth (JWT verification)
├── routes/
│   ├── auth.js            # Google OAuth token exchange, session endpoints
│   └── data.js            # Sleep data CRUD with full input sanitization
├── services/
│   ├── user-service.js    # User CRUD (findOrCreateUserByGoogle)
│   └── sleep-service.js   # Sleep settings, overrides, advance checks
├── src/
│   ├── main.jsx           # App entry (OAuth + Auth providers)
│   ├── App.jsx            # HashRouter, protected/public routes
│   ├── i18n/
│   │   ├── index.js       # i18next config (detection, fallback)
│   │   └── locales/       # en, es, pt, zh translation JSONs
│   ├── context/
│   │   └── AuthContext.jsx # Google auth + guest mode
│   ├── hooks/
│   │   └── useAuth.js
│   ├── lib/
│   │   └── api.js         # HTTP client with Bearer token, auto-logout on 401
│   └── components/
│       ├── CircadianCalculator.jsx   # Main app logic and UI
│       ├── LoginScreen.jsx           # Google Sign-In + guest entry
│       ├── UserMenu.jsx             # User avatar + logout dropdown
│       ├── LanguageSwitcher.jsx     # Language selector (EN/ES/PT/ZH)
│       └── GuestBanner.jsx          # Info banner for guest mode
├── electron/
│   ├── main.cjs           # Electron main process (OAuth popup, server fork)
│   └── preload.cjs        # contextBridge
└── tests/                 # 72 tests using node:test (SQLite in-memory)
```

## API

All data endpoints require a JWT in the `Authorization: Bearer <token>` header.

| Method | Endpoint            | Auth | Description                                    |
|--------|---------------------|------|------------------------------------------------|
| POST   | `/api/auth/google`  | No   | Exchange Google ID token for a JWT             |
| GET    | `/api/auth/me`      | Yes  | Get the authenticated user's profile           |
| POST   | `/api/auth/logout`  | Yes  | Logout (stateless, client-side token removal)  |
| GET    | `/api/data`         | Yes  | Get the user's sleep settings and overrides    |
| POST   | `/api/data`         | Yes  | Save sleep data (revision-based conflict check)|

### Data model

The SQLite database (`db/sync.db`) has 4 tables:

- **users** -- Google account info (id, email, display name, avatar)
- **sleep_settings** -- 1:1 per user (sleep/wake times, shift amount, consolidation days, revision counter)
- **day_overrides** -- Per-date overrides forcing hold or advance
- **advance_checks** -- Per-date advance confirmation flags

## Building the Desktop App

The Electron build produces a Windows installer (NSIS):

```bash
npm run electron:build:win
```

The installer is output to the `release/` directory. In production mode, Electron forks the Express server as a child process and manages its lifecycle.

## Features

- Gradual sleep schedule correction via phase advance algorithm
- 9 energy phases mapped to your wake time
- Per-day overrides (force hold or advance on any date)
- Advance confirmation checks
- **Multi-language UI** -- English (default), Spanish, Portuguese, Simplified Chinese, with automatic browser language detection
- **Guest/demo mode** -- try the app without an account; data stored in localStorage
- **Multi-user support** -- Google Sign-In with per-user data isolation in SQLite
- Revision-based conflict prevention on concurrent saves
- Dark/nocturnal theme UI
- Desktop app with Windows installer

## License

[MIT](LICENSE)
