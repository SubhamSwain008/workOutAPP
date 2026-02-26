/**
 * Retry-enabled fetch wrapper for Supabase.
 *
 * Free-tier Supabase projects go to sleep after inactivity.  The first
 * request after sleeping often fails at the DNS / TLS level with
 * `TypeError: Failed to fetch` — the request never reaches Supabase, so
 * their dashboard shows 0 requests.
 *
 * This module:
 * 1. Wraps `globalThis.fetch` with automatic retry + exponential back-off.
 * 2. Exposes a `wakeUpSupabase()` helper that pings Supabase and returns
 *    only once the project is reachable (or all retries are exhausted).
 * 3. Provides a connection-status store other components can subscribe to.
 *
 * Key design choice: each individual fetch attempt is wrapped with an
 * AbortController timeout so we don't wait 60–120 s for the browser's
 * default TCP timeout on `ERR_CONNECTION_TIMED_OUT`.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Per-attempt timeout — abort the fetch if no response within this window */
const ATTEMPT_TIMEOUT_MS = 10_000; // 10 s (browser TCP timeout is ~75 s)
const WAKE_ATTEMPT_TIMEOUT_MS = 8_000; // slightly shorter for lightweight pings

const MAX_RETRIES = 6; // 6 retries → total 7 attempts (~90 s worst-case)
const BASE_DELAY_MS = 2_000; // first retry after 2 s
const MAX_DELAY_MS = 15_000; // cap at 15 s

// ---------------------------------------------------------------------------
// Connection-status mini-store (subscribe from React via useSyncExternalStore)
// ---------------------------------------------------------------------------

type ConnectionStatus = "connected" | "waking" | "offline";

let _status: ConnectionStatus = "connected";
const _listeners = new Set<() => void>();

function setStatus(s: ConnectionStatus) {
  if (_status === s) return;
  _status = s;
  _listeners.forEach((l) => l());
}

/** React-friendly subscription (useSyncExternalStore) */
export const connectionStore = {
  getSnapshot: () => _status,
  subscribe: (listener: () => void) => {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  },
};

// Track the current wake-up attempt number so the UI can show progress
let _wakeAttempt = 0;
let _wakeTotal = MAX_RETRIES + 1;
// Cache the snapshot object so useSyncExternalStore gets a stable reference
let _wakeSnapshot = { attempt: _wakeAttempt, total: _wakeTotal };

function _updateWakeSnapshot() {
  if (_wakeSnapshot.attempt !== _wakeAttempt || _wakeSnapshot.total !== _wakeTotal) {
    _wakeSnapshot = { attempt: _wakeAttempt, total: _wakeTotal };
  }
}

export const wakeProgressStore = {
  getSnapshot: () => _wakeSnapshot,
  subscribe: (listener: () => void) => {
    _listeners.add(listener); // reuse same listener set
    return () => {
      _listeners.delete(listener);
    };
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRetryable(error: unknown): boolean {
  // "Failed to fetch" from network errors
  if (error instanceof TypeError) return true;
  // Our own AbortController timeout — retryable
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return false;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Wraps a fetch call with an AbortController that fires after `timeoutMs`.
 * If the caller already provided a signal we chain them together.
 */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): { promise: Promise<Response>; abort: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // If the caller already set a signal, respect it
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort());
  }

  const promise = globalThis
    .fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer));

  return { promise, abort: () => controller.abort() };
}

// ---------------------------------------------------------------------------
// Retry-enabled fetch (drop-in for Supabase createClient)
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for `globalThis.fetch` that:
 * - Aborts each attempt after ATTEMPT_TIMEOUT_MS (avoids 60 s TCP hangs)
 * - Retries on network / timeout errors with exponential back-off
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { promise } = fetchWithTimeout(input, init, ATTEMPT_TIMEOUT_MS);
      const res = await promise;

      // Success — mark connected if we were waking
      if (_status === "waking") setStatus("connected");

      return res;
    } catch (err) {
      lastError = err;

      if (!isRetryable(err) || attempt === MAX_RETRIES) {
        setStatus("offline");
        throw err;
      }

      // Signal the UI that we're waking Supabase
      if (_status !== "waking") setStatus("waking");

      const jitter = Math.random() * 500;
      const wait = Math.min(BASE_DELAY_MS * 2 ** attempt + jitter, MAX_DELAY_MS);

      console.warn(
        `[supabase-retry] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed (${(err as Error)?.message}) — retrying in ${Math.round(wait)} ms`,
      );

      await delay(wait);
    }
  }

  setStatus("offline");
  throw lastError;
}

// ---------------------------------------------------------------------------
// Wake-up helper
// ---------------------------------------------------------------------------

let _wakePromise: Promise<boolean> | null = null;

/**
 * Ping Supabase to wake it from cold sleep.
 * Returns `true` if reachable, `false` if all retries failed.
 * De-duplicated: concurrent calls share the same in-flight promise.
 *
 * Uses its own short timeout per attempt so we cycle quickly through
 * retries instead of waiting 60 s per TCP timeout.
 */
export function wakeUpSupabase(supabaseUrl: string): Promise<boolean> {
  if (_wakePromise) return _wakePromise;

  _wakePromise = (async () => {
    setStatus("waking");
    _wakeAttempt = 0;
    _updateWakeSnapshot();
    _listeners.forEach((l) => l()); // notify progress subscribers

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      _wakeAttempt = attempt + 1;
      _updateWakeSnapshot();
      _listeners.forEach((l) => l());

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), WAKE_ATTEMPT_TIMEOUT_MS);

        const res = await globalThis.fetch(`${supabaseUrl}/rest/v1/`, {
          method: "HEAD",
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY },
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));

        if (res.ok || res.status === 400 || res.status === 401) {
          // Any HTTP response means the server is alive
          setStatus("connected");
          return true;
        }
      } catch {
        // Network-level or timeout failure — retry
      }

      if (attempt < MAX_RETRIES) {
        const jitter = Math.random() * 500;
        const wait = Math.min(BASE_DELAY_MS * 2 ** attempt + jitter, MAX_DELAY_MS);
        console.warn(
          `[supabase-wake] Wake attempt ${attempt + 1}/${MAX_RETRIES + 1} failed — retrying in ${Math.round(wait)} ms`,
        );
        await delay(wait);
      }
    }

    setStatus("offline");
    return false;
  })().finally(() => {
    _wakePromise = null;
  });

  return _wakePromise;
}
