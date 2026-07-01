"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function VerifyCallbackContent() {
  const router = useRouter();
  const { user, loading: authLoading, completeVerification } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function handleCallback() {
      try {
        if (!user) {
          router.replace("/login?redirect=/verify-callback");
          return;
        }

        // Reload the user to get the latest emailVerified status
        const { reload } = await import("firebase/auth");
        await reload(user);

        if (!user.emailVerified) {
          setStatus("error");
          setErrorMsg("Email verification failed. Please try resending the verification email.");
          return;
        }

        // Email is verified! Call completeVerification (which just reloads profile — NO token assignment)
        await completeVerification();

        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } catch {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    }

    handleCallback();
  }, [user, authLoading, router, completeVerification]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
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
        </div>

        <div className="nuvio-card rounded-3xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/15 mb-5">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verifying your email…</h1>
              <p className="text-sm text-muted-foreground">
                Hang tight — redirecting to your dashboard.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 mb-5">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email verified! ✅</h1>
              <p className="text-sm text-muted-foreground mb-4">
                Your email is confirmed. Redirecting to your dashboard…
              </p>
              <p className="text-xs text-muted-foreground/70">
                Not redirecting?{" "}
                <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Go to dashboard →
                </Link>
              </p>
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

export default function VerifyCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    }>
      <VerifyCallbackContent />
    </Suspense>
  );
}
