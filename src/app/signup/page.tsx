"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ACCOUNTS_FULL_ERROR } from "@/lib/auth-context";
import {
  getPreviousSignupEmail,
  recordSignup,
} from "@/lib/abuse-prevention";
import { Mail, Lock, Eye, EyeOff, Loader2, Chrome, AlertCircle, CheckCircle, Users, ShieldAlert } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [accountsFull, setAccountsFull] = useState(false);
  const [tempmailBlocked, setTempmailBlocked] = useState(false);
  const [multiAccountWarning, setMultiAccountWarning] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Block 1: tempmail domains — check against whitelist (server-side)
    setLoading(true);
    try {
      const validateRes = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const validateData = await validateRes.json();
      if (!validateData.allowed) {
        setLoading(false);
        setTempmailBlocked(true);
        return;
      }
    } catch {
      // If the validation service is down, proceed (don't block legit users)
    }

    // NOTE: We no longer block multi-account signups entirely.
    // Instead, repeat signups are allowed but will NOT get a 7-day free trial.
    // The /verify page checks localStorage and skips the trial if they've
    // signed up before with a different email. They can still pay to get access.
    recordSignup(email);

    try {
      const result = await signup(email, password);
      // Always go straight to the dashboard — no "Check your inbox" screen.
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === ACCOUNTS_FULL_ERROR) {
        setAccountsFull(true);
      } else if (msg.includes("email-already-in-use")) {
        setError("__LINK__An account with this email already exists. Log in__END__");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("weak-password")) {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(msg || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Silently ignore popup cancellations — just reset the button
      if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request") || msg.includes("auth/cancel")) {
        // User cancelled — no error message needed, just reset loading
      } else if (msg.includes("account-exists-with-different-credential") || msg.includes("email-already-in-use")) {
        setError("You already have an account with this email. Please log in with your password instead.");
      } else if (msg === ACCOUNTS_FULL_ERROR) {
        setAccountsFull(true);
      } else {
        setError(msg || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  if (tempmailBlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md nuvio-card rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 mb-5">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Disposable email blocked</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We don&apos;t accept temporary or disposable email addresses. Please use a real
            email from Gmail, Outlook, Yahoo, etc. This helps us prevent abuse and keep
            Nuvio affordable for everyone.
          </p>
          <Link
            href="/signup"
            onClick={() => setTempmailBlocked(false)}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Try a different email
          </Link>
        </div>
      </main>
    );
  }

  if (multiAccountWarning) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md nuvio-card rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mb-5">
            <ShieldAlert className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Not eligible for free trial</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sorry, you are not eligible for the 7-day free trial. Each person is allowed one free trial only.
            <br /><br />
            If you believe this is an error, please contact support.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl nuvio-gradient-bg px-5 py-3 text-sm font-semibold text-white"
          >
            Log in to your account
          </Link>
        </div>
      </main>
    );
  }

  if (accountsFull) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md nuvio-card rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mb-5">
            <Users className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">All accounts are taken</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;re sorry — all available Nuvio accounts are currently assigned. New accounts
            are added regularly. Please check back soon, or message us to be notified.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md nuvio-card rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 mb-5">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
          <p className="text-sm text-muted-foreground mb-3">
            We sent a verification link to <span className="font-semibold text-foreground">{email}</span>. Click it to verify your email and choose a plan.
          </p>
          <p className="text-xs text-amber-400 mb-6 font-medium">
            ⚠️ Don&apos;t see it? Check your spam/junk folder.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Already verified? Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <img
              src="https://nuvio.tv/assets/Logo_1080x1080.png"
              alt="Nuvio"
              width={40}
              height={44}
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold tracking-tight">Nuvio</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No credit card required to sign up. Pick a plan after verifying your email.
          </p>
        </div>

        <div className="nuvio-card rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {error.includes("__LINK__") ? (
                  <>
                    {error.replace("__LINK__", "").replace("__END__", "").replace("Log in", "")}
                    <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold underline">Log in</Link>
                  </>
                ) : (
                  error
                )}
              </span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-white/10 active:scale-95 transition disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Chrome className="h-5 w-5" />
            )}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="nuvio-gradient-bg nuvio-glow w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60 active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground/70">
          By signing up, you agree to Nuvio&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
