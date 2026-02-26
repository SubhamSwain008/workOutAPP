import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useSyncExternalStore, type ReactNode } from "react";
import { wakeProgressStore } from "../lib/supabaseRetry";

/* ------------------------------------------------------------------ */
/*  Shared loading / waking / error screens                            */
/* ------------------------------------------------------------------ */

function WakingScreen() {
    const { attempt, total } = useSyncExternalStore(
        wakeProgressStore.subscribe,
        wakeProgressStore.getSnapshot,
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: '1rem',
            padding: '1rem',
            textAlign: 'center',
        }}>
            <div
                style={{
                    width: 44,
                    height: 44,
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Waking up server…</p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', maxWidth: 340 }}>
                The server was sleeping due to inactivity.<br />
                This can take up to a minute — hang tight!
            </p>
            {attempt > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Attempt {attempt} / {total}
                </p>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}

function ConnectionErrorScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: '1rem',
            padding: '1rem',
            textAlign: 'center',
        }}>
            <p style={{ fontSize: '1.5rem' }}>⚠️</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Connection Failed</p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', maxWidth: 320 }}>
                Unable to reach the server. Please check your internet connection and try again.
            </p>
            <button
                onClick={onRetry}
                style={{
                    marginTop: '0.5rem',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#fff',
                    backgroundColor: '#6366f1',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                }}
            >
                Retry
            </button>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.2rem'
        }}>
            Loading...
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Route guards                                                       */
/* ------------------------------------------------------------------ */

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 *
 * Handles 5 auth/connection states:
 * 1. waking  → shows "Waking up server" spinner
 * 2. connectionError → shows error + retry button
 * 3. loading → shows loading spinner
 * 4. authenticated → renders children
 * 5. unauthenticated → redirects to login
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { session, loading, waking, connectionError, retryConnection } = useAuth();

    if (connectionError) {
        return <ConnectionErrorScreen onRetry={retryConnection} />;
    }

    if (waking) {
        return <WakingScreen />;
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

interface PublicRouteProps {
    children: ReactNode;
}

/**
 * PublicRoute - For pages like login/signup
 *
 * Same connection-aware states as ProtectedRoute.
 */
export function PublicRoute({ children }: PublicRouteProps) {
    const { session, loading, waking, connectionError, retryConnection } = useAuth();

    if (connectionError) {
        return <ConnectionErrorScreen onRetry={retryConnection} />;
    }

    if (waking) {
        return <WakingScreen />;
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (session) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
}
