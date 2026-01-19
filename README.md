# Supabase Workout Tracker Frontend

A modern React-based workout tracking application built with TypeScript, Vite, and Supabase. This app allows users to create workout plans, log daily workouts, track exercises with sets/reps/weights, and monitor progress over time.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link)
- **Styling**: CSS (with potential for CSS-in-JS or frameworks)
- **Package Manager**: npm/bun

## Project Structure

```
frontend/
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   ├── _redirects
│   └── _rewrites
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── assets/
    ├── auth/
    │   ├── AuthProvider.tsx
    │   ├── RouteGuards.tsx
    │   ├── authcheck/
    │   │   └── authcheck.ts
    │   ├── login/
    │   │   └── login.tsx
    │   └── signup/
    ├── components/
    │   ├── navbar/
    │   │   └── navbar.tsx
    │   └── workout_plan/
    │       └── Workout_plan.tsx
    ├── lib/
    │   ├── important.sql
    │   └── supabase.ts
    ├── models/
    │   ├── activeplan.ts
    │   ├── exercise.ts
    │   ├── profile.ts
    │   ├── workout_day.ts
    │   └── workout_plan.ts
    ├── pages/
    │   ├── analyticsAndAi/
    │   │   ├── intensityAnalytics.tsx
    │   │   ├── plotVolume_loads.tsx
    │   │   ├── Volume_Load.tsx
    │   │   └── states/
    │   │       ├── maxweight.ts
    │   │       └── volume_load_store.ts
    │   ├── home/
    │   │   ├── Home.tsx
    │   │   └── rightSection.tsx
    │   ├── Profile/
    │   │   ├── bmi.ts
    │   │   ├── profile.tsx
    │   │   └── profileCard.tsx
    │   ├── public/
    │   └── workout/
    │       ├── addPresentday.tsx
    │       ├── addSets.tsx
    │       ├── lastDay.tsx
    │       ├── muscles_type.tsx
    │       ├── pastWorkouts.tsx
    │       ├── seePastWorkout.tsx
    │       └── workout.tsx
    ├── states/
    │   ├── activeplan.ts
    │   ├── canStartWorkout.ts
    │   ├── curretActiveWorkout.ts
    │   └── useAuthStore.ts
```

## Data Models

### User Authentication
- **Supabase Auth**: Magic link email authentication
- **Session Management**: Automatic session checking and redirection
- **User State**: Stored in Zustand store with user ID and profile

### Workout Plan
```typescript
type WorkoutPlan = {
  id: string;
  name: string;
  split_type: string;        // e.g., "Push/Pull/Legs"
  days_per_week: number;     // e.g., 3, 4, 5, 6
  is_active: boolean;
};
```
- Users can create and activate workout plans
- Only one active plan per user at a time

### Workout Day
```typescript
type WorkoutDay = {
  id: string;
  plan_id: string;
  day_index: number;         // Sequential day number
  day_type_name: string;     // e.g., "Push", "Pull", "Legs"
  created_at: string;
};
```
- Represents a single workout session
- Linked to a workout plan
- Users can only log one workout per day (IST timezone)

### Exercise
```typescript
type ExerciseRow = {
  id: string;
  name: string;              // Exercise name (e.g., "Bench Press")
  set_number: number;        // Set number within the exercise
  number_of_reps: number;    // Repetitions performed
  weight: number;            // Weight used (in kg)
  created_at: string;
  targated_muscles: string[]; // Array of muscle keys
  is_the_exercise_on: boolean; // Currently active exercise
  is_the_exercise_done: boolean; // Completed exercise
};
```
- Individual sets within a workout day
- Supports multiple sets per exercise
- Tracks targeted muscles using predefined muscle groups

### Muscle Targeting
- Comprehensive muscle database with 50+ muscle groups
- Organized by body regions (Chest, Shoulders, Back, etc.)
- Each muscle has a user-friendly label and technical key
- Supports multiple muscle targeting per exercise

## Application Workflow

### 1. Authentication Flow
1. **Login Page** (`/login`): User enters email
2. **Magic Link**: Supabase sends authentication email
3. **Email Verification**: User clicks link, redirected to `/home`
4. **Session Check**: `useAuthCheck` hook validates session on every protected route
5. **Auto-redirect**: Unauthenticated users redirected to login

### 2. Home Dashboard Flow
1. **Active Plan Check**: Fetches user's active workout plan
2. **Plan Display**: Shows current workout plan details
3. **Navigation**: Access to profile and workout pages

### 3. Workout Management Flow

#### Adding a Workout Day
1. **Check Last Workout**: Compares last workout date with today (IST)
2. **Prevent Duplicates**: Blocks adding workout if already logged today
3. **Day Type Selection**: Choose from existing types or create new
4. **Create Workout Day**: Inserts new record in `workout_day` table

#### Adding Exercises and Sets
1. **Exercise Selection**: Search and select exercise name
2. **Muscle Targeting**: Select targeted muscle groups
3. **Set Details**: Input reps and weight
4. **Add Set**: Creates exercise record with `is_the_exercise_on: true`
5. **Multiple Sets**: Continue adding sets to same exercise
6. **Finish Exercise**: Mark `is_the_exercise_on: false` and `is_the_exercise_done: true`

#### Workout Session States
- **No Active Workout**: Can add new workout day
- **Active Workout Day**: Can add exercises
- **Active Exercise**: Can add sets to current exercise
- **Completed Exercise**: Can start new exercise or finish workout

### 4. Data Flow

#### State Management (Zustand)
- **useUserStore**: User ID, profile data
- **useActivePlanStore**: Current workout plan details
- **useCanStartWorkoutStore**: Permission to start workout (based on last workout date)
- **useCurretWorkoutStore**: Current active exercise name

#### Database Operations
- **Supabase Client**: Centralized in `lib/supabase.ts`
- **Real-time Queries**: Fetches data on component mount
- **CRUD Operations**: Create workout days, exercises, sets
- **Relationships**: 
  - `workout_plan` → `workout_day` (one-to-many)
  - `workout_day` → `exercise` (one-to-many)

#### API Patterns
- **Authentication**: Supabase Auth for session management
- **Data Fetching**: Direct Supabase queries with RLS policies
- **Error Handling**: Console logging with user alerts for auth errors
- **Optimistic Updates**: Local state updates before database confirmation

## Key Functions and Components

### Authentication Hook (`useAuthCheck`)
- Checks Supabase session on mount
- Redirects to login if unauthenticated
- Fetches and sets active workout plan
- Used in all protected pages

### Workout Day Management (`AddPresentDay`)
- Fetches last workout to prevent duplicates
- IST timezone handling for date comparisons
- Day type selection with existing/new options
- Inserts new workout day record

### Exercise Management (`AddSets`)
- Fetches today's workout day ID
- Exercise name suggestions from database
- Muscle selection with search and filtering
- Set addition with reps/weight input
- Exercise completion workflow

### State Synchronization
- Components sync with database on mount
- Real-time state updates across components
- Cross-page state persistence via Zustand

## Analytics & Progress Tracking

### Intensity & Volume Load
- **Intensity Analytics**: Tracks daily exercise intensity (sets × reps × weight) grouped by IST date and exercise name.
- **Volume Load Analytics**: Tracks total volume load for each exercise per day, with IST timezone grouping.
- **Max Weight Tracking**: Stores and displays max weight lifted for each exercise, with date.
- **State Management**: Uses Zustand stores (`useVolumeLoadStore`, `useMaxLoadStore`) to persist analytics data across pages.
- **Plotting**: Uses [Recharts](https://recharts.org/) for interactive charts (date vs volume load, max weight sidebar).
- **IST Timezone**: All analytics and charts use Indian Standard Time for accurate daily grouping.

### Example Analytics Pages
- `/analyticsAndAi/intensityAnalytics.tsx`: Shows intensity per exercise per day.
- `/analyticsAndAi/Volume_Load.tsx`: Shows volume load per exercise per day.
- `/analyticsAndAi/plotVolume_loads.tsx`: Plots volume load over time for selected exercise, with max weight sidebar.

### Zustand Stores
- `useVolumeLoadStore`: Stores `{ date, exerciseName, volume_load }` for plotting and analytics.
- `useMaxLoadStore`: Stores `{ date, exerciseName, max_weight }` for max weight tracking.

## Deployment & Hosting

- **Static Hosting**: Vite build outputs can be deployed to Netlify, Vercel, Render, etc.
- **SPA Routing**: Use `_redirects` or dashboard rewrite rules to serve `index.html` for all routes.
- **Environment Variables**: Must be set in hosting dashboard before build for Supabase connectivity.

## Developer Guide & Troubleshooting

### Scripts
- `npm run dev` — Start Vite dev server (hot reload)
- `npm run build` — Type-check and build production bundle (`tsc -b && vite build`)
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint across the repo

### Key development notes
- **TypeScript-first**: Types live in `src/models/` and are used across components, stores and API calls.
- **State management**: Global state lives in `src/states/` (Zustand). Analytics-specific stores are in `src/pages/analyticsAndAi/states/` (`useVolumeLoadStore`, `useMaxLoadStore`).
- **Auth**: The app uses an `AuthProvider` (`src/auth/AuthProvider.tsx`) which exposes `{ session, user, loading }` via `useAuth()` and protects routes using `ProtectedRoute`/`PublicRoute` in `src/auth/RouteGuards.tsx`.
- **Timezone**: All daily grouping and comparisons use IST (Asia/Kolkata). Look for helper functions named like `getISTDateString` or `getTodayISTKey`.

### Analytics / Charts
- **Data flow**: Analytics pages fetch supabase data, compute per-day/per-exercise metrics, populate zustand stores and render UI components.
- **Plotting**: Charts use **Recharts** (`recharts` dependency). See `src/pages/analyticsAndAi/plotVolume_loads.tsx` for a minimal example of plotting `date` vs `volume_load` with a selectable exercise.
- **How to add a new chart**:
  1. Add computation to an analytics page (group by IST date, reduce sets into metrics).
  2. Optionally persist series into a zustand store for cross-page sharing.
  3. Render with Recharts — provide `date` as `dataKey` on the X axis and numeric metric as Y.

### Troubleshooting Checklist
- Blank page on refresh in production: Ensure your hosting (Render/Netlify/Vercel) is rewriting `/*` to `/index.html` so the SPA router can handle routes. For Render, add a rewrite rule in the Dashboard (Source `/*` → Destination `/index.html`, Action `Rewrite`).
- Auth white screen on initial load: App previously returned nothing during the auth restore gap. The current app uses `AuthProvider` + `ProtectedRoute`/`PublicRoute` to display a loading fallback until Supabase restores the session.
- Missing Supabase env vars: Verify the following env variables are set **before build** in your host dashboard (Render/Netlify/Vercel):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - `VITE_FRONTEND_URL` (optional, used for magic-link redirects)
- Debugging tip: Open Browser Console (F12) on production — the app logs auth/session errors and other helpful messages.

### Security & RLS
- The front-end relies on Supabase Row-Level Security (RLS) to protect user data. Verify that RLS policies on the backend allow only owner access for `workout_plan`, `workout_day`, and `exercise`.

### Testing
- There are currently no automated tests in the project. Recommended next steps:
  - Add unit tests for computation functions (e.g., intensity/volume reduction)
  - Add a few integration tests for protected routes and auth flows using Playwright or Cypress

## Contributing

Pull requests and issues are welcome! Please open an issue for feature requests or bug reports.

### Suggested workflow
- Create a feature branch `feature/your-feature`.
- Keep commits small and focused; use conventional commits where possible.
- Push to your fork and open a PR with a short description and testing notes.

---
