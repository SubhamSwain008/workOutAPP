import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const hasTokenHash = params.get("token_hash");

  const [verifying, setVerifying] = useState(!!hasTokenHash);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (!token_hash) return;

    supabase.auth
      .verifyOtp({
        token_hash,
        type: (type as EmailOtpType) || "email",
      })
      .then(({ error }) => {
        if (error) setAuthError(error.message);
        else {
          setAuthSuccess(true);
          window.history.replaceState({}, document.title, "/login");
        }
      })
      .finally(() => setVerifying(false));
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${frontendUrl}/login`,
      },
    });

    if (error) alert(error.message);
    else alert("Check your email for the magic link.");

    setLoading(false);
  };

  /* ---------- Layout Shell ---------- */

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-foreground shadow-xl px-7 py-8">
        {children}
      </div>
    </div>
  );

  /* ---------- States ---------- */

  if (verifying) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold mb-2">Verifying login</h1>
        <p className="text-sm text-muted-foreground">
          Confirming your magic link…
        </p>
      </Shell>
    );
  }

  if (authError) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-destructive mb-2">
          Authentication failed
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{authError}</p>

        <button
          onClick={() => {
            setAuthError(null);
            window.history.replaceState({}, document.title, "/login");
          }}
          className="
            w-full h-11 rounded-lg
            border border-border
            text-sm font-medium
            hover:bg-muted
            transition
          "
        >
          Back to login
        </button>
      </Shell>
    );
  }

  if (authSuccess) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold mb-2">Login successful</h1>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </Shell>
    );
  }

  /* ---------- Login Form ---------- */

  return (
    <Shell>
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          We’ll send you a secure magic link
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Email address
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="
              w-full h-11 rounded-lg
              bg-background
              border border-border
              px-3 text-sm
              placeholder:text-muted-foreground
              focus:outline-none
              focus:ring-2 focus:ring-ring
              focus:border-transparent
            "
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full h-11 rounded-lg
            bg-primary text-primary-foreground
            text-sm font-medium
            transition
            hover:opacity-90
            active:scale-[0.98]
            disabled:opacity-60
            disabled:pointer-events-none
          "
        >
          {loading ? "Sending…" : "Send magic link"}
        </button>
      </form>

      <p className="mt-6 text-xs text-center text-muted-foreground">
        No password required. One-time secure login link.
      </p>
    </Shell>
  );
}
