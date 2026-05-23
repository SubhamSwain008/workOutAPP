import type { ExerciseRow, Profile, WorkoutDay, WorkoutPlan } from "../models";

const DEFAULT_URL = "http://10.0.2.2:3001";

export function getBackendUrl(): string {
  return (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? DEFAULT_URL;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${path}: ${text}`);
  }
  return (await res.json()) as T;
}

export type ClaimResponse = {
  user_id: string;
  username: string;
  created_at: string;
  is_new: boolean;
};

export async function claimUsername(username: string, clientUserId?: string): Promise<ClaimResponse> {
  return request<ClaimResponse>("/auth/claim", {
    method: "POST",
    body: JSON.stringify({ username, client_user_id: clientUserId ?? null }),
  });
}

export type PullResponse = {
  server_time: string;
  plans: Array<Omit<WorkoutPlan, never>>;
  days: Array<Omit<WorkoutDay, never>>;
  exercises: Array<Omit<ExerciseRow, never>>;
  profile: Omit<Profile, "user_id"> | null;
};

export async function pullSince(userId: string, since: string): Promise<PullResponse> {
  const url = `/sync/pull?user_id=${encodeURIComponent(userId)}&since=${encodeURIComponent(since)}`;
  return request<PullResponse>(url);
}

export type PushBody = {
  user_id: string;
  plans?: WorkoutPlan[];
  days?: WorkoutDay[];
  exercises?: ExerciseRow[];
  profile?: Omit<Profile, "user_id"> | null;
};

export async function pushChanges(body: PushBody): Promise<{ ok: true; server_time: string }> {
  return request("/sync/push", { method: "POST", body: JSON.stringify(body) });
}

export async function pingBackend(timeoutMs = 4_000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${getBackendUrl()}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
