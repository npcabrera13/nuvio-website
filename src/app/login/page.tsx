"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, ACCOUNTS_FULL_ERROR } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff, Loader2, Chrome, AlertCircle } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in and there's a redirect (e.g. from /verify), go there
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user && redirect) {
      router.replace(redirect);
    }
  }, [user, authLoading, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // If there's a redirect (from /verify), go there. Otherwise dashboard.
      router.push(redirect || "/dashboard");
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code || "";
      const msg = err instanceof Error ? err.message : String(err);
      const errorInfo = `${errorCode} ${msg}`.toLowerCase();

      if (errorInfo.includes("too-many-requests")) {
        setError("Too many attempts. Please try again later.");
      } else {
        // Check if the account actually exists using fetchSignInMethodsForEmail
        // NOTE: This requires "Email Enumeration Protection" to be DISABLED in
        // Firebase Console → Authentication → Settings → User Actions
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.length === 0) {
            // Account doesn't exist
            setError("Don't have an account? Sign up.");
          } else {
            // Account exists → wrong password
            setError("Incorrect password. Try again.");
          }
        } catch {
          setError("Incorrect email or password.");
        }
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
      router.push(redirect || "/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === ACCOUNTS_FULL_ERROR) {
        setError("All Nuvio accounts are currently taken. Please check back soon.");
      } else {
        setError(msg || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

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
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to continue streaming.
          </p>
        </div>

        <div className="nuvio-card rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  placeholder="Your password"
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Logging in…
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-violet-400 hover:text-violet-300">
              Start your free trial
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
