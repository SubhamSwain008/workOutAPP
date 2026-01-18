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
├── src/
│   ├── auth/                    # Authentication components
│   │   ├── authcheck/          # Auth checking hook
│   │   ├── login/              # Login page
│   │   └── signup/             # Signup (if implemented)
│   ├── components/             # Reusable UI components
│   │   ├── navbar/             # Navigation bar
│   │   └── workout_plan/       # Workout plan creation/management
│   ├── lib/                    # Utilities and configurations
│   │   ├── supabase.ts         # Supabase client setup
│   │   └── important.sql       # Database schema/queries
│   ├── models/                 # TypeScript type definitions
│   │   ├── activeplan.ts       # Active workout plan types
│   │   ├── exercise.ts         # Exercise data types
│   │   ├── profile.ts          # User profile types
│   │   ├── workout_day.ts      # Workout day types
│   │   └── workout_plan.ts     # Workout plan types
│   ├── pages/                  # Page components
│   │   ├── home/               # Home dashboard
│   │   │   ├── Home.tsx        # Main home page
│   │   │   └── rightSection.tsx # Sidebar/right panel
│   │   ├── Profile/            # User profile management
│   │   │   ├── profile.tsx     # Profile page
│   │   │   └── profileCard.tsx # Profile card component
│   │   └── workout/            # Workout tracking pages
│   │       ├── addPresentday.tsx # Add today's workout day
│   │       ├── addSets.tsx     # Add sets to exercises
│   │       ├── lastDay.tsx     # Display last workout
│   │       ├── muscles_type.tsx # Muscle targeting definitions
│   │       ├── pastWorkouts.tsx # Past workouts viewer
│   │       ├── seePastWorkout.tsx # Detailed past workout view
│   │       └── workout.tsx     # Main workout page
│   ├── states/                 # Zustand state stores
│   │   ├── activeplan.ts       # Active workout plan state
│   │   ├── canStartWorkout.ts  # Workout start permission state
│   │   ├── curretActiveWorkout.ts # Current active workout state
│   │   └── useAuthStore.ts     # User authentication state
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx                # App entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tsconfig*.json              # TypeScript configurations
└── README.md                   # This file
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

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
VITE_FRONTEND_URL=http://localhost:5173
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

2. **Set Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Supabase credentials.

3. **Start Development Server**:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Database Schema

The app uses the following main tables:
- `workout_plan`: User workout plans
- `workout_day`: Individual workout sessions
- `exercise`: Exercise sets with details
- `profiles`: User profile information (via Supabase auth.users)

See `lib/important.sql` for database setup and queries.

## Development Notes

- **Timezone Handling**: All date comparisons use IST (Asia/Kolkata)
- **State Management**: Zustand for global state, local state for UI
- **Error Handling**: Basic console logging, user alerts for auth
- **Performance**: Components fetch data on mount, no caching implemented
- **Security**: Supabase RLS policies handle data access control

## Future Enhancements

- Progress tracking and analytics
- Exercise library with images/videos
- Social features (sharing workouts)
- Mobile app version
- Advanced workout planning tools
- Integration with fitness wearables
