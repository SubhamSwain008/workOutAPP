import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Dumbbell, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

/* ---------- Layout Shell ---------- */

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex">
    {/* Left: Brand / visual panel */}
    <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-linear-to-br from-primary via-primary to-[#5a2dd9] text-primary-foreground">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Dumbbell className="w-8 h-8" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold tracking-tight">WorkOut</span>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight max-w-md">
            Get in shape.
            <br />
            <span className="text-white/90">Track every rep.</span>
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-sm">
            Sign in to sync your workouts and keep your progress across devices.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          No password needed — we’ll send you a secure link.
        </p>
      </div>
    </div>

    {/* Right: Form panel */}
    <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
      <div className="w-full max-w-[400px]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Dumbbell className="w-7 h-7 text-primary" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold text-foreground">WorkOut</span>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const hasTokenHash = params.get("token_hash");

  const [verifying, setVerifying] = useState(!!hasTokenHash);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    setEmailSent(false);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${frontendUrl}/login`,
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setEmailSent(true);
    }
    setLoading(false);
  };

  /* ---------- States ---------- */

  if (verifying) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center py-8">
          <div className="p-4 rounded-2xl bg-primary/10 mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Verifying login</h1>
          <p className="text-muted-foreground">Confirming your magic link…</p>
        </div>
      </Shell>
    );
  }

  if (authError && !emailSent) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-2xl bg-destructive/10 mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-destructive mb-2">
              Authentication failed
            </h1>
            <p className="text-sm text-muted-foreground mb-6">{authError}</p>
            <button
              onClick={() => {
                setAuthError(null);
                window.history.replaceState({}, document.title, "/login");
              }}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition"
            >
              Back to login
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (authSuccess) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center py-8">
          <div className="p-4 rounded-2xl bg-chart-1/20 mb-6">
            <CheckCircle2 className="w-10 h-10 text-chart-1" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">You’re in</h1>
          <p className="text-muted-foreground">Redirecting…</p>
        </div>
      </Shell>
    );
  }

  /* ---------- Login Form ---------- */

  return (
    <Shell>
      <div className="lg:mb-10 mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we’ll send you a secure link.
        </p>
      </div>

      {emailSent ? (
        <div className="rounded-2xl border border-chart-1/30 bg-chart-1/5 p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-chart-1 mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-1">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We sent a magic link to <strong className="text-foreground">{email}</strong>
          </p>
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending link…
              </>
            ) : (
              "Send magic link"
            )}
          </button>
        </form>
      )}

      <p className="mt-8 text-xs text-center text-muted-foreground max-w-sm mx-auto">
        No password required. Click the link in your email to sign in securely.
      </p>
    </Shell>
  );
}
