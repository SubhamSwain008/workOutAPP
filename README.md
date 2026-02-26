# Supabase Workout Tracker — Frontend (workOutAPP) 🔧

A TypeScript + React SPA built with Vite that connects to a Supabase backend to track workout plans, log daily workouts, capture exercises (sets/reps/weights), and provide analytics (volume, intensity, max load) plus AI-driven insights.

---

## Quick overview 🎯

- Authentication: Supabase Auth (magic-link email)
- Database: Supabase (Postgres) with RLS (recommended)
- State: Zustand for compact global state
- Charts: Recharts (for volume/max-weight plots)
- Styling: Tailwind + DaisyUI utilities (CSS)
- Build & Run: Vite + TypeScript

---

## Table of contents

- Features ✅
- Getting started (dev & build) ▶️
- Environment variables and required secrets 🔐
- Project layout and explanation 🗂️
- Important flows and components (Auth, Workout, Analytics) 🧭
- Data models & database notes 🧾
- Troubleshooting & deployment tips ⚠️
- Development notes & contributions ✍️

---

## Features ✅

- Magic-link email authentication
- Create / edit / set active workout plans (one active plan per user)
- Add a workout day (one per calendar day in IST)
- Log exercises & multiple sets, mark exercises finished
- Searchable muscle targeting from a predefined list (50+ muscle groups)
- Workout history with CSV export, search and date filters
- Volume/intensity charts and AI analysis (sends displayed CSV to backend AI endpoint)
- Lightweight global state via Zustand for user, active plan and session data

---

## Getting started ▶️

Prerequisites:
- Node.js (v18+ recommended)
- npm or bun

Install dependencies:

```bash
npm install
# or
# bun install
```

Run local dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production locally:

```bash
npm run preview
```

Linting:

```bash
npm run lint
```

---

## Environment variables & secrets 🔐

Set the following before running/building — these are required for Supabase and AI backend (if used):

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase anon/public key
- `VITE_FRONTEND_URL` — (optional) used as the email magic-link redirect (e.g. `https://your.site/login`)
- `VITE_BACKEND_URL` — (optional) backend API URL for AI analytics (used with `Token()` bearer token)

Note: All Vite env variables must be prefixed with `VITE_`.

---

## Project layout & file responsibilities 🗂️

High-level tree (important files explained):

- `index.html` — App host
- `src/main.tsx` — App entry: wraps `App` with `BrowserRouter` and `AuthProvider`
- `src/App.tsx` — Route definitions and top-level layout

File structure (full):

```
.env
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package.json
├─ README.md
├─ tailwind.config.js
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ public
│  ├─ _redirects
│  └─ _rewrites
└─ src
   ├─ App.tsx
   ├─ index.css
   ├─ main.tsx
   ├─ assets/
   ├─ auth/
   │  ├─ AuthProvider.tsx
   │  ├─ RouteGuards.tsx
   │  ├─ authcheck/
   │  │  └─ authcheck.ts
   │  ├─ login/
   │  │  └─ login.tsx
   │  └─ supabseToken/
   │     └─ Token.tsx
   ├─ components/
   │  ├─ navbar/
   │  │  └─ navbar.tsx
   │  └─ workout_plan/
   │     └─ Workout_plan.tsx
   ├─ lib/
   │  ├─ important.sql
   │  └─ supabase.ts
   ├─ models/
   │  ├─ activeplan.ts
   │  ├─ exercise.ts
   │  ├─ profile.ts
   │  ├─ workout_day.ts
   │  └─ workout_plan.ts
   ├─ pages/
   │  ├─ analyticsAndAi/
   │  │  ├─ AiAnalyticts.tsx
   │  │  ├─ intensityAnalytics.tsx
   │  │  ├─ plotVolume_loads.tsx
   │  │  ├─ Volume_Load.tsx
   │  │  ├─ AiAnalytics/
   │  │  │  ├─ AIControls.tsx
   │  │  │  ├─ DateFilter.tsx
   │  │  │  ├─ responsePrompt.ts
   │  │  │  ├─ ResultsTable.tsx
   │  │  │  ├─ SearchBar.tsx
   │  │  │  └─ types.ts
   │  │  └─ states/
   │  │     ├─ maxweight.ts
   │  │     └─ volume_load_store.ts
   │  ├─ home/
   │  │  ├─ Home.tsx
   │  │  └─ rightSection.tsx
   │  ├─ Profile/
   │  │  ├─ bmi.ts
   │  │  ├─ profile.tsx
   │  │  └─ profileCard.tsx
   │  ├─ workout/
   │  │  ├─ addPresentday.tsx
   │  │  ├─ addSets.tsx
   │  │  ├─ lastDay.tsx
   │  │  ├─ muscles_type.tsx
   │  │  ├─ seePastWorkout.tsx
   │  │  ├─ TodaypastWorkouts.tsx
   │  │  └─ workout.tsx
   │  └─ workoutHistory/
   │     ├─ DateFilter.tsx
   │     ├─ history.tsx
   │     ├─ HistoryTable.tsx
   │     ├─ Pagination.tsx
   │     ├─ SearchControls.tsx
   │     └─ types.ts
   └─ states/
      ├─ activeplan.ts
      ├─ canStartWorkout.ts
      ├─ curretActiveWorkout.ts
      ├─ useAuthStore.ts
      └─ localSates/
         └─ theme.ts
```

Auth:
- `src/auth/AuthProvider.tsx` — establishes Supabase session, listens to auth state changes, sets user and active plan in Zustand stores
- `src/auth/RouteGuards.tsx` — `ProtectedRoute` and `PublicRoute` wrappers to show loading UI and perform redirects
- `src/auth/authcheck/authcheck.ts` — `useAuthCheck()` hook used on protected pages to ensure session exists and active plan is loaded
- `src/auth/login/login.tsx` — Magic link login form and token verification handler
- `src/auth/supabseToken/Token.tsx` — returns the current Supabase access token for backend requests

API client:
- `src/lib/supabase.ts` — Supabase client (single source of truth)

Models:
- `src/models/*` — TypeScript data shapes: `WorkoutPlan`, `WorkoutDay`, `ExerciseRow`, `Profile` etc.

Global state (Zustand stores):
- `src/states/useAuthStore.ts` — user ID and profile
- `src/states/activeplan.ts` — active plan details and helpers
- `src/states/canStartWorkout.ts` — whether a workout session can be started for today
- `src/states/curretActiveWorkout.ts` — active exercise name for UI hints

Pages & components (summary):
- `src/pages/home` — `Home.tsx` and `rightSection.tsx` (main dashboard + recent items)
- `src/components/workout_plan/Workout_plan.tsx` — add/edit/list workout plans
- `src/pages/workout/*` — `addPresentday.tsx`, `addSets.tsx`, `lastDay.tsx`, `seePastWorkout.tsx`, `TodaypastWorkouts.tsx` (workout flows)
  - IST helpers (`toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })`) are used to group by calendar day in IST
- `src/pages/workout/muscles_type.tsx` — exported `TARGETED_MUSCLES` list used when tagging sets
- `src/pages/workoutHistory/*` — search, pagination, CSV export of workout history
- `src/pages/analyticsAndAi/*` — volume/intensity analytics, plotting with Recharts, and `AiAnalyticts.tsx` which sends visible CSV to the backend AI endpoint
- `src/components/navbar/navbar.tsx` — top navigation and theme toggle (writes to `localStorage.theme`)

---

## Important flows & implementation details 🧭

Authentication:
- `AuthProvider` calls `supabase.auth.getSession()` on mount and subscribes to `onAuthStateChange`. It sets the user ID in `useUserStore` and fetches the user's active workout plan (if any) and populates `useActivePlanStore`.
- `ProtectedRoute` / `PublicRoute` show a loading state while auth is being restored and otherwise redirect appropriately.

Workout plan lifecycle:
- Create plan: `Workout_plan.tsx` inserts a `workout_plan` row. If marked `is_active`, it sets all other plans for that user to `is_active = false`.
- Edit plan: updates fields and locally keeps the 'active' plan on top of the list.

Workout day / Add Present Day:
- A workout day is added only once per calendar day (IST). Helper functions normalize dates using `toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })` so 'today' follows IST.
- `addPresentday.tsx` fetches existing `workout_day` rows for the active plan and prevents adding a second workout day for the same IST date.

Exercise & sets (addSets.tsx):
- Exercises are stored per `workout_day`. Each set is an `exercise` row with `set_number`, `number_of_reps`, `weight`, `targated_muscles`, `is_the_exercise_on`, etc.
- When you `addSet()` a new set row is inserted. The first set for an exercise starts it (is_the_exercise_on = true).
- `finishExercise()` toggles `is_the_exercise_on=false` and `is_the_exercise_done=true` for all rows with that name for the workout day.
- Deleting a set also re-numbers subsequent sets in DB and locally to maintain contiguous `set_number` ordering.
- Search suggestions for exercise names use a Supabase RPC `get_exercise_name_suggestions` (server-side helper for fuzzy search).

History & analytics:
- `workoutHistory` allows searching by day or exercise, date filtering (1 month, 3 months, manual), pagination and CSV export.
- Analytics pages compute intensity/volume metrics grouped by IST date and exercise name, and persist computed series in small Zustand stores for re-use in charts.

AI analytics:
- AI analytics (`AiAnalyticts.tsx`) build a CSV from the currently displayed workout rows and POST it to a backend AI endpoint (`VITE_BACKEND_URL/Ask-Ai`) with an Authorization header using the Supabase session token (via `Token()`). The backend handles the AI interaction.

---

## Data models & DB notes 🧾

Core tables expected in Supabase:

- `workout_plan` — { id, user_id, name, split_type, days_per_week, is_active, created_at }
- `workout_day` — { id, plan_id, day_index, day_type_name, created_at }
- `exercise` — { id, workout_day_id, name, set_number, number_of_reps, weight, is_body_weighted, targated_muscles (array), is_the_exercise_on, is_the_exercise_done, created_at }
- `profiles` — (user profile data used in `ProfileCard`) with `id` = user id and optional fields like name, age, height, weight

Notes:
- RLS should allow a user to select and modify only their own rows (i.e., policies checking `auth.uid()` against `user_id` or row owner fields).
- There is an example SQL file `src/lib/important.sql` (check it for helpful DDL / indexes / functions).

---

## Troubleshooting & deployment tips ⚠️

- SPA rewrite rule: ensure hosting rewrites `/*` → `/index.html` for client-side routing.
- Missing env vars cause auth/connectivity issues — verify `VITE_` prefixed vars are set in your host before build.
- For auth problems: open the browser console, check network / Supabase responses.
- Timezone gotchas: All daily grouping is intentionally done in IST. When running locally in other timezones, results are normalized using the helper functions.

---

## Developer notes & recommended improvements ✍️

- Tests: add unit tests for analytics reducers and key helper functions (IST normalization, volume/intensity aggregation).
- Add E2E tests to cover login, protected routes and workout flows (Cypress / Playwright).
- Consider adding optimistic UI patterns around set deletion/renumbering for a smoother UX.
- Add server-side validation (RLS + DB constraints) to ensure `set_number` integrity and `targated_muscles` shape.

---

## Contributing

1. Fork & branch from `main` (e.g., `feature/your-feature`)
2. Keep changes small and include tests where appropriate
3. Open a PR and describe user-facing changes and testing steps

---

