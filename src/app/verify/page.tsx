"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, ACCOUNTS_FULL_ERROR } from "@/lib/auth-context";
import { getPreviousSignupEmail } from "@/lib/abuse-prevention";
import { Loader2, CheckCircle, XCircle, Sparkles, Users } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { user, loading: authLoading, completeVerification, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "success-no-trial" | "error" | "accounts-full" | "need-login">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found. Check your email link.");
      return;
    }

    // Wait for Firebase Auth to load before proceeding
    if (authLoading) return;

    async function verify() {
      try {
        // Step 1: Verify the JWT signature via the Function (0 Firestore)
        const res = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed.");
          return;
        }

        // Step 2: User must be logged in to assign the Nuvio account.
        // If they're not logged in (opened email link in different browser/app),
        // auto-redirect to login. After login, they'll be sent back here.
        if (!user) {
          try { sessionStorage.setItem("nuvio-pending-verify", token); } catch {}
          // Auto-redirect to login (no "need-login" screen)
          router.replace("/login?redirect=/verify?token=" + encodeURIComponent(token));
          return;
        }

        // Step 3: Check if this user already used their free trial.
        // If they did, verify the email but DON'T assign a token — they must pay.
        const prevEmail = getPreviousSignupEmail();
        const skipTrial = !!prevEmail && prevEmail !== user.email?.toLowerCase();

        try {
          await completeVerification(skipTrial);
        } catch (err) {
          if (err instanceof Error && err.message === ACCOUNTS_FULL_ERROR) {
            setStatus("accounts-full");
            return;
          }
          throw err;
        }

        if (skipTrial) {
          // Email verified but no trial — redirect to dashboard where they
          // can pay to get access
          setStatus("success-no-trial");
          setTimeout(() => router.push("/dashboard"), 3000);
          return;
        }

        setStatus("success");
        await refreshProfile();
        setTimeout(() => router.push("/dashboard"), 2500);
      } catch {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      }
    }
    verify();
  }, [token, authLoading, user, completeVerification, refreshProfile, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
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
        </div>

        <div className="nuvio-card rounded-3xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/15 mb-5">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verifying your email…</h1>
              <p className="text-sm text-muted-foreground">
                Hang tight — unlocking your dashboard.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 mb-5">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email verified! 🎉</h1>
              <p className="text-sm text-muted-foreground mb-4">
                <Sparkles className="inline h-4 w-4 text-pink-400 mr-1" />
                Your 7-day free trial is now active. Redirecting to your dashboard…
              </p>
              <p className="text-xs text-muted-foreground/70">
                Not redirecting?{" "}
                <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Go to dashboard →
                </Link>
              </p>
            </>
          )}

          {status === "success-no-trial" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 mb-5">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email verified!</h1>
              <p className="text-sm text-muted-foreground mb-4">
                Your email is confirmed. Since you&apos;ve already used a free trial before,
                you can choose a plan to start streaming. Redirecting to your dashboard…
              </p>
              <p className="text-xs text-muted-foreground/70">
                Not redirecting?{" "}
                <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Go to dashboard →
                </Link>
              </p>
            </>
          )}

          {status === "need-login" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/15 mb-5">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Almost there!</h1>
              <p className="text-sm text-muted-foreground mb-5">
                Your email is verified. Log in to claim your Nuvio account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl nuvio-gradient-bg px-5 py-3 text-sm font-semibold text-white"
              >
                Log in to continue
              </Link>
            </>
          )}

          {status === "accounts-full" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mb-5">
                <Users className="h-8 w-8 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">All accounts are taken</h1>
              <p className="text-sm text-muted-foreground mb-5">
                Your email is verified, but all Nuvio accounts are currently assigned.
                New accounts are added regularly — please check back soon.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Go to login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 mb-5">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
              <p className="text-sm text-red-300 mb-5">{errorMsg}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
