"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2, Play } from "lucide-react";

export function FinalCta() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <section id="trial" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-12 sm:px-12 sm:py-16 text-center">
          {/* gradient background */}
          <div className="absolute inset-0 -z-10 nuvio-gradient-bg opacity-90" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="absolute inset-0 -z-10 nuvio-grid-bg opacity-30" />

          {status === "success" ? (
            <div className="nuvio-rise">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 mb-5">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                You&apos;re on the list!
              </h2>
              <p className="mt-4 text-base text-white/85 max-w-md mx-auto">
                Check your inbox for your 7-day free trial link. Your streaming
                journey starts now.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Ready to start watching?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl mx-auto">
                Join 2,400+ Filipinos streaming everything for ₱49/month. Enter your
                email to start your 7-day free trial — no credit card needed.
              </p>

              {/* Email form */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto"
              >
                <div className="relative flex-1 w-full">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    aria-label="Email address"
                    className="w-full rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 py-3.5 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-violet-700 shadow-xl transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                  Start Free Trial
                </button>
              </form>

              {status === "error" && errorMsg && (
                <p className="mt-3 text-sm text-red-200" role="alert">
                  {errorMsg}
                </p>
              )}
              {/* Screen-reader live region for form status */}
              <span className="sr-only" aria-live="polite">
                {status === "loading"
                  ? "Submitting your email"
                  : status === "success"
                    ? "Success! You're on the list. Check your inbox."
                    : status === "error"
                      ? `Error: ${errorMsg}`
                      : ""}
              </span>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  🔒 Secure via PayMongo
                </span>
                <span className="flex items-center gap-1.5">
                  💳 GCash & Maya accepted
                </span>
                <span className="flex items-center gap-1.5">
                  ⏱ Setup in 2 min
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
