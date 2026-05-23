# workOutMobile

Capacitor + Vite + React build of the workout tracker. Local SQLite, syncs to
the Hono backend in `../workOutBackend/`.

See the top-level [README](../README.md) for the full picture.

## Scripts

```bash
npm install
npm run dev                # browser dev (Vite, port 5173)
npm run build              # type-check + production bundle to dist/
npm run cap:sync           # build + npx cap sync android
npm run android:open       # opens Android Studio
npm run android:run        # build + sync + run on attached device/emulator
```

## Rebuilding the APK from scratch

```bash
export JAVA_HOME=/home/subham/.local-jdk/jdk-21.0.5+11
export ANDROID_HOME=/home/subham/Android/sdk
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Architecture

- `src/db/sqlite.ts` — Capacitor SQLite wrapper (works on web + Android)
- `src/db/schema.ts` — local schema + migration runner
- `src/db/repos/*.ts` — typed CRUD layer for plans/days/exercises/profile
- `src/lib/sync.ts` — push/pull engine, last-write-wins, restore-from-cloud
- `src/lib/api.ts` — backend HTTP client
- `src/states/*.ts` — Zustand stores (user, active plan, theme, sync)
- `src/pages/*.tsx` — one page per route
- `src/components/*.tsx` — shared UI (BottomNav, AppShell, Sheet, RestTimer…)
