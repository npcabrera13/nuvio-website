"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff, Loader2, Chrome, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email, password);
      if (result.needsVerification) {
        setSuccess(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists. Try logging in.");
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
      const result = await loginWithGoogle();
      if (result.needsVerification) {
        setSuccess(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md nuvio-card rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 mb-5">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a verification link to <span className="font-semibold text-foreground">{email}</span>. Click it to unlock your 7-day free trial.
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
              src="https://i.ibb.co/J91qPG0/Logo-1080x1080.png"
              alt="Nuvio"
              width={40}
              height={44}
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold tracking-tight">Nuvio</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Start your 7 days free
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="nuvio-card rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
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
                "Create account & start free trial"
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
