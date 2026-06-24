"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2, Copy, Check, LogOut, Clock, Mail, Key, Sparkles,
  Calendar, Zap, Shield, Tv, Film, AlertCircle, ChevronRight, Crown
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

function useCountdown(expiresAt: Timestamp | null) {
  const [remaining, setRemaining] = useState<{d:number;h:number;m:number;s:number} | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => {
      const diff = expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ d, h, m, s });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{className?: string}> }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <div className="flex items-center justify-between gap-3">
        <code className="text-sm sm:text-base font-mono text-foreground truncate">{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-95 ${
            copied
              ? "bg-green-500/20 text-green-400"
              : "bg-white/10 text-foreground/70 hover:bg-white/20"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl nuvio-card border-violet-500/30">
        <span className="text-2xl sm:text-3xl font-extrabold tabular-nums nuvio-gradient-text">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

const RENEW_PLANS = [
  { days: 30, price: 49, perDay: "₱1.63", popular: false },
  { days: 90, price: 129, perDay: "₱1.43", popular: true },
  { days: 60, price: 89, perDay: "₱1.48", popular: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const countdown = useCountdown(profile?.expiresAt ?? null);
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    );
  }

  if (profile && !profile.emailVerified) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md nuvio-card rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mb-5">
            <Mail className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a verification link to <span className="font-semibold text-foreground">{user.email}</span>. Click it to unlock your dashboard.
          </p>
          <button
            onClick={async () => {
              await fetch("/api/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, uid: user.uid, username: profile.username }),
              });
            }}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Resend verification email
          </button>
          <button
            onClick={signOut}
            className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    );
  }

  const isExpired = countdown && countdown.d === 0 && countdown.h === 0 && countdown.m === 0 && countdown.s === 0;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {profile.email || user.email || "Nuvio User"} 👋
            </h1>
          </div>
          <button
            onClick={signOut}
            aria-label="Log out"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Trial Status / Countdown */}
        <div className="nuvio-card rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,0.12),transparent_50%)]" />
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold">
              {isExpired ? "Trial expired" : "Your free trial ends in"}
            </h2>
          </div>
          {countdown && !isExpired ? (
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <CountdownBox value={countdown.d} label="Days" />
              <span className="text-2xl font-bold text-muted-foreground/30">:</span>
              <CountdownBox value={countdown.h} label="Hours" />
              <span className="text-2xl font-bold text-muted-foreground/30">:</span>
              <CountdownBox value={countdown.m} label="Mins" />
              <span className="text-2xl font-bold text-muted-foreground/30">:</span>
              <CountdownBox value={countdown.s} label="Secs" />
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-lg text-muted-foreground mb-4">
                Your 7-day free trial has ended. Renew to keep streaming.
              </p>
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="nuvio-card rounded-3xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Key className="h-5 w-5 text-pink-400" />
            <h2 className="text-lg font-bold">Your login credentials</h2>
          </div>
          <div className="space-y-3">
            <CopyField label="Email" value={profile.email || user.email || "—"} icon={Mail} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-400" />
            Use your email and the password you chose at signup to log in. Keep them safe — you&apos;ll need them to access your subscription.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { Icon: Film, value: "10,000+", label: "Titles" },
            { Icon: Tv, value: "Full HD", label: "Quality" },
            { Icon: Zap, value: "2 min", label: "Setup" },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="nuvio-card rounded-2xl p-4 text-center">
              <Icon className="h-5 w-5 mx-auto text-violet-400 mb-2" />
              <p className="text-sm sm:text-base font-bold">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Renew Subscription */}
        <div className="nuvio-card rounded-3xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Crown className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold">Renew your subscription</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {RENEW_PLANS.map((plan) => (
              <div
                key={plan.days}
                className={`relative rounded-2xl border p-5 transition-all ${
                  plan.popular
                    ? "border-violet-500/40 bg-violet-500/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full nuvio-gradient-bg px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <Sparkles className="h-3 w-3" /> BEST VALUE
                  </span>
                )}
                <p className="text-sm text-muted-foreground">{plan.days} days</p>
                <p className="mt-1 text-3xl font-extrabold">₱{plan.price}</p>
                <p className="mt-0.5 text-xs text-green-400">{plan.perDay}/day</p>
                <button
                  className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
                    plan.popular
                      ? "nuvio-gradient-bg text-white"
                      : "border border-white/15 bg-white/5 text-foreground hover:bg-white/10"
                  }`}
                >
                  Coming soon
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Payment via GCash, Maya & credit card coming soon. For now, enjoy your free trial!
          </p>
        </div>

        {/* What's included */}
        <div className="nuvio-card rounded-3xl p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" /> What you get
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "10,000+ movies & series",
              "Live TV channels",
              "Trending anime",
              "Full HD streaming",
              "Watch on phone, TV, laptop",
              "No ads, no buffer",
              "Cancel anytime",
              "GCash & Maya accepted",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to site */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
