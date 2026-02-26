import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Dumbbell, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

/* ---------- Layout Shell (mobile-first, responsive) ---------- */

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-dvh bg-background flex flex-col lg:flex-row">
    {/* Mobile: compact hero strip with gradient + blob */}
    <div className="lg:hidden relative overflow-hidden pt-[env(safe-area-inset-top)] px-4 pb-6">
      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-[#5a2dd9] opacity-95" />
      <div
        className="absolute top-1/4 -right-16 w-40 h-40 rounded-full bg-white/25 blur-2xl animate-[login-blob-float_8s_ease-in-out_infinite]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute bottom-1/4 -left-12 w-32 h-32 rounded-full bg-white/20 blur-2xl animate-[login-blob-float_10s_ease-in-out_infinite]"
        style={{ animationDelay: "-2s" }}
      />
      <div className="relative z-10 flex items-center justify-center gap-2.5 py-4">
        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm animate-[login-scale-in_0.4s_ease-out_both]">
          <Dumbbell className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
        </div>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-white animate-[login-fade-up_0.4s_ease-out_0.05s_both]">
          WorkOut
        </span>
      </div>
      <p className="relative z-10 text-center text-white/85 text-sm px-2 animate-[login-fade-up_0.4s_ease-out_0.1s_both]">
        Get in shape. Track every rep.
      </p>
    </div>

    {/* Desktop: Left brand panel */}
    <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-linear-to-br from-primary via-primary to-[#5a2dd9] text-primary-foreground">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/30 blur-3xl animate-[login-blob-float_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl animate-[login-blob-float_14s_ease-in-out_infinite]" style={{ animationDelay: "-3s" }} />
      </div>
      <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Dumbbell className="w-8 h-8" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold tracking-tight">WorkOut</span>
        </div>
        <div className="space-y-5 xl:space-y-6">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight max-w-md">
            Get in shape.
            <br />
            <span className="text-white/90">Track every rep.</span>
          </h2>
          <p className="text-primary-foreground/80 text-base xl:text-lg max-w-sm">
            Sign in to sync your workouts and keep your progress across devices.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          No password needed — we’ll send you a secure link.
        </p>
      </div>
    </div>

    {/* Form panel: mobile-first padding and safe area */}
    <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-12 pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-[400px]">
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
    setAuthError(null);

    // Retry up to 3 times — the first attempt may fail if Supabase is cold
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${frontendUrl}/login`,
          },
        });

        if (error) {
          // If it's a network error and we have retries left, keep trying
          if (
            attempt < MAX_ATTEMPTS &&
            (error.message.toLowerCase().includes("failed to fetch") ||
              error.message.toLowerCase().includes("network"))
          ) {
            await new Promise((r) => setTimeout(r, 2000 * attempt));
            continue;
          }
          setAuthError(error.message);
        } else {
          setEmailSent(true);
        }
        break; // success or non-retryable error — stop
      } catch (err) {
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        setAuthError(
          "Unable to reach the server. The server may be waking up — please wait a moment and try again.",
        );
        break;
      }
    }

    setLoading(false);
  };

  /* ---------- States ---------- */

  if (verifying) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center py-6 sm:py-8 animate-[login-fade-up_0.4s_ease-out_both]">
          <div className="p-4 rounded-2xl bg-primary/10 mb-5 sm:mb-6">
            <Loader2 className="w-9 h-9 sm:w-10 sm:h-10 text-primary animate-spin" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Verifying login</h1>
          <p className="text-sm text-muted-foreground animate-[login-pulse-soft_1.2s_ease-in-out_infinite]">Confirming your magic link…</p>
        </div>
      </Shell>
    );
  }

  if (authError && !emailSent) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg animate-[login-shake_0.4s_ease-out_both]">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-2xl bg-destructive/10 mb-5 sm:mb-6">
              <AlertCircle className="w-9 h-9 sm:w-10 sm:h-10 text-destructive" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-destructive mb-2">
              Authentication failed
            </h1>
            <p className="text-sm text-muted-foreground mb-5 sm:mb-6">{authError}</p>
            <button
              onClick={() => {
                setAuthError(null);
                window.history.replaceState({}, document.title, "/login");
              }}
              className="w-full min-h-[44px] h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition touch-manipulation"
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
        <div className="flex flex-col items-center text-center py-6 sm:py-8 animate-[login-scale-in_0.4s_ease-out_both]">
          <div className="p-4 rounded-2xl bg-chart-1/20 mb-5 sm:mb-6">
            <CheckCircle2 className="w-9 h-9 sm:w-10 sm:h-10 text-chart-1" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-2">You’re in</h1>
          <p className="text-sm text-muted-foreground">Redirecting…</p>
        </div>
      </Shell>
    );
  }

  /* ---------- Login Form (mobile-first, staggered animations) ---------- */

  return (
    <Shell>
      <div className="mb-6 sm:mb-8 md:mb-10">
        <h1
          className="text-2xl sm:text-3xl md:text-[2rem] lg:text-3xl font-bold tracking-tight text-foreground animate-[login-fade-up_0.45s_ease-out_both]"
          style={{ animationDelay: "0ms" }}
        >
          Sign in
        </h1>
        <p
          className="mt-1.5 sm:mt-2 text-muted-foreground text-sm sm:text-base animate-[login-fade-up_0.45s_ease-out_both]"
          style={{ animationDelay: "60ms" }}
        >
          Enter your email and we’ll send you a secure link.
        </p>
      </div>

      {emailSent ? (
        <div className="rounded-2xl border border-chart-1/30 bg-chart-1/5 p-5 sm:p-6 text-center animate-[login-scale-in_0.4s_ease-out_both]">
          <CheckCircle2 className="w-11 h-11 sm:w-12 sm:h-12 text-chart-1 mx-auto mb-3 sm:mb-4" />
          <h2 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-4 break-all">
            We sent a magic link to <strong className="text-foreground">{email}</strong>
          </p>
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="min-h-[44px] py-2.5 text-sm font-medium text-primary hover:underline touch-manipulation"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div
            className="space-y-2 animate-[login-fade-up_0.45s_ease-out_both]"
            style={{ animationDelay: "120ms" }}
          >
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full min-h-[44px] h-12 pl-11 sm:pl-12 pr-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition touch-manipulation"
              />
            </div>
          </div>

          <div
            className="animate-[login-fade-up_0.45s_ease-out_both]"
            style={{ animationDelay: "180ms" }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition flex items-center justify-center gap-2 touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span>Sending link…</span>
                </>
              ) : (
                "Send magic link"
              )}
            </button>
          </div>
        </form>
      )}

      <p
        className="mt-6 sm:mt-8 text-xs text-center text-muted-foreground max-w-sm mx-auto leading-relaxed animate-[login-fade-up_0.45s_ease-out_both]"
        style={{ animationDelay: "240ms" }}
      >
        No password required. Click the link in your email to sign in securely.
      </p>
    </Shell>
  );
}
