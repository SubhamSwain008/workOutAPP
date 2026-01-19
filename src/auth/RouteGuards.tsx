import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * Handles 3 auth states:
 * 1. loading → shows loading spinner
 * 2. authenticated → renders children
 * 3. unauthenticated → redirects to login
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { session, loading } = useAuth();

    if (loading) {
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
 * Handles 3 auth states:
 * 1. loading → shows loading spinner
 * 2. authenticated → redirects to home
 * 3. unauthenticated → renders children (login page)
 */
export function PublicRoute({ children }: PublicRouteProps) {
    const { session, loading } = useAuth();

    if (loading) {
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

    if (session) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
}
