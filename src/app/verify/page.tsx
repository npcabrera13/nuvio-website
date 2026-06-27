"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { refreshProfile, user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found. Check your email link.");
      return;
    }

    async function verify() {
      try {
        // Call the verify-email Function — it verifies the HMAC signature
        // WITHOUT touching Firestore (the token is a signed JWT, not a DB doc).
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

        // The Function returned { tokenId } — update the customer doc status to "active".
        // This is the ONLY Firestore write for verification (1 write, no reads).
        if (data.tokenId) {
          try {
            await updateDoc(doc(db, "customers", data.tokenId), {
              status: "active",
            });
          } catch (err) {
            console.error("Failed to update customer status:", err);
          }
        }

        setStatus("success");
        if (user) await refreshProfile();
        setTimeout(() => router.push("/dashboard"), 2500);
      } catch {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      }
    }
    verify();
  }, [token, user, refreshProfile, router]);

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
