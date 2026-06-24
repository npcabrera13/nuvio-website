"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CHANNELS } from "@/lib/nuvio";
import {
  Loader2, Copy, Check, LogOut, Clock, Mail, Key, Sparkles,
  Zap, Shield, Tv, Film, ChevronRight, Crown, Gift, TrendingDown,
  Heart, Star, Play, AlertCircle, Home
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

// ─── Countdown hook ─────────────────────────────────────────────
function useCountdown(expiresAt: Timestamp | null) {
  const [remaining, setRemaining] = useState<{d:number;h:number;m:number;s:number} | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => {
      const diff = expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) { setRemaining({ d:0,h:0,m:0,s:0 }); return; }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

// ─── Glass card wrapper ─────────────────────────────────────────
function GlassCard({ children, className = "", accent = false }: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`nuvio-glass-card rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 hover:-translate-y-0.5 ${className}`}
    >
      {accent && <div className="h-1 w-16 rounded-full nuvio-gradient-bg mb-5" />}
      {children}
    </div>
  );
}

// ─── Copy field ─────────────────────────────────────────────────
function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{className?: string}> }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/15">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1 flex items-center gap-1.5">
          <Icon className="h-3 w-3" /> {label}
        </p>
        <code className="text-sm font-mono text-foreground truncate block">{value}</code>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`}
        className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
          copied ? "bg-green-500/20 text-green-400" : "bg-white/8 text-foreground/60 hover:bg-white/15 hover:text-foreground"
        }`}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Referral section ───────────────────────────────────────────
function ReferralCard() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      let c = localStorage.getItem("nuvio-referral-code");
      if (!c) {
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        c = "NUVRIO-" + Array.from({length:6}).map(() => chars[Math.floor(Math.random()*chars.length)]).join("");
        localStorage.setItem("nuvio-referral-code", c);
      }
      setCode(c);
    } catch { setCode("NUVRIO-WELCOME"); }
  }, []);

  const link = mounted ? `${window.location.origin}/?ref=${code}` : "";
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <GlassCard accent>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 text-pink-400 ring-1 ring-pink-500/20">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold">Refer & earn</h2>
          <p className="text-xs text-muted-foreground">Give 7 days, get 7 days</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Share your link. When a friend starts their free trial, you both get 7 extra days — free.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <p className="text-[10px] text-muted-foreground/70 mb-0.5 uppercase tracking-wider">Your link</p>
          <p className="text-sm font-mono truncate text-foreground/90">{mounted ? link : "loading…"}</p>
        </div>
        <button type="button" onClick={copyLink}
          className="nuvio-gradient-bg inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold text-white active:scale-95 transition-transform shadow-lg shadow-violet-900/20">
          {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
      </div>
    </GlassCard>
  );
}

// ─── Savings section ────────────────────────────────────────────
function SavingsCard() {
  return (
    <GlassCard accent>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400 ring-1 ring-green-500/20">
          <TrendingDown className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold">You&apos;re saving</h2>
          <p className="text-xs text-muted-foreground">vs. subscribing separately</p>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-4xl sm:text-5xl font-extrabold text-green-400 tabular-nums">₱2,600</span>
        <span className="text-sm text-muted-foreground">/year</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400">98% less</span>
        <span className="text-xs text-muted-foreground">than Netflix + Disney+ + HBO + Prime</span>
      </div>
    </GlassCard>
  );
}

// ─── Feature comparison ─────────────────────────────────────────
const FEATURES = [
  { label: "Movies & series", nuvio: "10,000+", others: "1,000–2,000" },
  { label: "Live TV channels", nuvio: "Included", others: "Not included" },
  { label: "Anime", nuvio: "Included", others: "Extra $7.99/mo" },
  { label: "Pinoy content", nuvio: "Full library", others: "Limited" },
  { label: "Full HD streaming", nuvio: true, others: true },
  { label: "GCash / Maya", nuvio: true, others: false },
  { label: "Price/month", nuvio: "₱49", others: "₱400–650" },
];

function FeatureComparison() {
  return (
    <GlassCard accent>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400 ring-1 ring-violet-500/20">
          <Star className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold">Why you&apos;ll love staying</h2>
          <p className="text-xs text-muted-foreground">Nuvio vs. the competition</p>
        </div>
      </div>
      <div className="space-y-1">
        {FEATURES.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
            <span className="text-sm text-foreground/80">{f.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-green-400 text-right min-w-[90px]">
                {f.nuvio === true ? <Check className="h-4 w-4 inline" /> : f.nuvio}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Channels grid ──────────────────────────────────────────────
function ChannelsPreview() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? CHANNELS : CHANNELS.slice(0, 12);
  return (
    <GlassCard accent>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-400 ring-1 ring-violet-500/20">
            <Tv className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold">Your channels</h2>
            <p className="text-xs text-muted-foreground">{CHANNELS.length} included</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
        {visible.map((c) => <ChannelMini key={c.name} channel={c} />)}
      </div>
      {CHANNELS.length > 12 && (
        <button type="button" onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-center text-sm font-semibold text-violet-400 hover:text-violet-300 transition">
          {showAll ? "Show less" : `Show all ${CHANNELS.length} channels →`}
        </button>
      )}
    </GlassCard>
  );
}

function ChannelMini({ channel }: { channel: (typeof CHANNELS)[number] }) {
  const [errored, setErrored] = useState(false);
  const colors = ["#7c3aed","#ec4899","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];
  const color = colors[channel.name.length % colors.length];
  return (
    <div className="aspect-square rounded-xl border border-white/8 bg-white/[0.02] flex items-center justify-center p-2 overflow-hidden transition-colors hover:border-white/15">
      {errored ? (
        <div className="flex h-full w-full items-center justify-center rounded-lg" style={{ backgroundColor: color }}>
          <span className="text-[10px] font-bold text-white text-center px-1 line-clamp-2">{channel.name}</span>
        </div>
      ) : (
        <img src={channel.logo} alt={channel.name} loading="lazy" onError={() => setErrored(true)}
          className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
}

// ─── Renewal plans ──────────────────────────────────────────────
const PLANS = [
  { days: 30, price: 49, perDay: "1.63", popular: false },
  { days: 90, price: 129, perDay: "1.43", popular: true },
  { days: 60, price: 89, perDay: "1.48", popular: false },
];

// ─── Main dashboard ─────────────────────────────────────────────
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
        <GlassCard className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mb-5">
            <Mail className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a verification link to <span className="font-semibold text-foreground">{user.email}</span>. Click it to unlock your dashboard.
          </p>
          <button onClick={async () => {
            await fetch("/api/send-verification", {
              method: "POST", headers: {"Content-Type":"application/json"},
              body: JSON.stringify({ email: user.email, uid: user.uid }),
            });
          }} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition">
            Resend verification email
          </button>
          <button onClick={signOut} className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground">Log out</button>
        </GlassCard>
      </main>
    );
  }

  if (!profile) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></main>;
  }

  const isExpired = countdown && countdown.d === 0 && countdown.h === 0 && countdown.m === 0 && countdown.s === 0;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-violet-600/12 blur-[140px]" />
        <div className="absolute top-1/4 -right-32 h-[28rem] w-[28rem] rounded-full bg-pink-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/8 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* ─── HERO: Welcome + Countdown + Mascot ─── */}
        <GlassCard className="mb-6 relative overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            {/* Left: welcome + countdown */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Welcome back</p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {profile.email?.split("@")[0] || "Nuvio User"} 👋
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/" aria-label="Home"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
                    <Home className="h-4 w-4" />
                  </Link>
                  <button onClick={signOut} aria-label="Log out"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isExpired ? (
                /* ─── Expired: We missed you ─── */
                <div className="mt-6">
                  <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-fuchsia-500/5 p-5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-pink-400" />
                      <h2 className="text-lg font-bold text-pink-300">We missed you 💜</h2>
                    </div>
                    <p className="text-sm text-pink-200/80 leading-relaxed">
                      Your free trial has ended, but Nuvio is still here for you. Renew now to instantly unlock everything again — your watchlist is waiting.
                    </p>
                  </div>
                  <a href="#renew"
                    className="nuvio-gradient-bg inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white active:scale-95 transition-transform shadow-lg shadow-violet-900/30">
                    <Crown className="h-4 w-4" /> Renew now
                  </a>
                </div>
              ) : countdown ? (
                /* ─── Active: countdown ─── */
                <div className="mt-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Your free trial ends in
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {[
                      { v: countdown.d, l: "Days" },
                      { v: countdown.h, l: "Hrs" },
                      { v: countdown.m, l: "Min" },
                      { v: countdown.s, l: "Sec" },
                    ].map((unit, i) => (
                      <div key={unit.l} className="flex items-center gap-1.5 sm:gap-2">
                        <div className="flex flex-col items-center">
                          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-pink-500/10 border border-white/10 backdrop-blur-md shadow-lg">
                            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums nuvio-gradient-text">
                              {String(unit.v).padStart(2, "0")}
                            </span>
                          </div>
                          <span className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{unit.l}</span>
                        </div>
                        {i < 3 && <span className="text-xl sm:text-2xl font-bold text-muted-foreground/20 -mt-5">:</span>}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                    Full access to everything. No card needed yet.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Right: mascot */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/20 to-pink-500/10 blur-3xl rounded-full" />
              <img
                src="/mascot/nuvio-mascot.png"
                alt="Nuvio mascot"
                className="relative h-72 w-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Mobile mascot */}
          <div className="lg:hidden flex justify-center mt-4">
            <img src="/mascot/nuvio-mascot.png" alt="Nuvio mascot" className="h-44 w-auto object-contain drop-shadow-2xl" />
          </div>
        </GlassCard>

        {/* ─── Quick stats row ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { Icon: Film, value: "10,000+", label: "Titles" },
            { Icon: Tv, value: "Full HD", label: "Quality" },
            { Icon: Zap, value: "2 min", label: "Setup" },
            { Icon: Shield, value: "Secure", label: "Payment" },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="nuvio-glass-card rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5">
              <Icon className="h-5 w-5 mx-auto text-violet-400 mb-2" />
              <p className="text-sm sm:text-base font-bold">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* ─── Credentials ─── */}
        <GlassCard className="mb-6" accent>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-400 ring-1 ring-pink-500/20">
              <Key className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">Your login</h2>
              <p className="text-xs text-muted-foreground">Keep these safe</p>
            </div>
          </div>
          <CopyField label="Email" value={profile.email || user.email || "—"} icon={Mail} />
        </GlassCard>

        {/* ─── Savings + Referral (2 cols) ─── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <SavingsCard />
          <ReferralCard />
        </div>

        {/* ─── Channels ─── */}
        <div className="mb-6">
          <ChannelsPreview />
        </div>

        {/* ─── Feature comparison ─── */}
        <div className="mb-6">
          <FeatureComparison />
        </div>

        {/* ─── Renewal plans ─── */}
        <div id="renew" className="scroll-mt-24 mb-6">
          <GlassCard accent>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 ring-1 ring-amber-500/20">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold">{isExpired ? "Renew your subscription" : "Keep the magic going"}</h2>
                <p className="text-xs text-muted-foreground">Payment coming soon — enjoy your trial for now</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {PLANS.map((plan) => (
                <div key={plan.days} className={`relative rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                  plan.popular ? "border-violet-500/40 bg-gradient-to-br from-violet-500/8 to-pink-500/5" : "border-white/8 bg-white/[0.02]"
                }`}>
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full nuvio-gradient-bg px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                      <Sparkles className="h-3 w-3" /> BEST VALUE
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground">{plan.days} days</p>
                  <p className="mt-1 text-3xl font-extrabold">₱{plan.price}</p>
                  <p className="mt-0.5 text-xs text-green-400">₱{plan.perDay}/day</p>
                  <button className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
                    plan.popular ? "nuvio-gradient-bg text-white shadow-lg shadow-violet-900/20" : "border border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                  }`}>
                    Coming soon
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ─── Footer ─── */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
