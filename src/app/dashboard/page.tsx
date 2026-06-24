"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CHANNELS } from "@/lib/nuvio";
import {
  Loader2, Copy, Check, LogOut, Clock, Mail, Key, Sparkles,
  Zap, Shield, Tv, Film, ChevronRight, Crown, Gift, TrendingDown,
  Heart, Star, Home, CheckCircle2, User
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CIRCULAR COUNTDOWN TIMER — the centerpiece
// ═══════════════════════════════════════════════════════════════

function CircularTimer({ expiresAt }: { expiresAt: Timestamp | null }) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0, pct: 0 });
  const TRIAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => {
      const diff = expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ d: 0, h: 0, m: 0, s: 0, pct: 0 });
        return;
      }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        pct: Math.min(100, (diff / TRIAL_MS) * 100),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isExpired = remaining.d === 0 && remaining.h === 0 && remaining.m === 0 && remaining.s === 0;

  // SVG circle geometry
  const size = 260;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (remaining.pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* The circular gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#timer-gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isExpired ? (
            <>
              <Heart className="h-7 w-7 text-pink-400 mb-2" />
              <span className="text-sm font-bold text-pink-300 uppercase tracking-wider">Expired</span>
              <span className="text-xs text-muted-foreground mt-1">Renew to continue</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-green-400 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Active
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums tracking-tight nuvio-gradient-text">
                  {String(remaining.d).padStart(2, "0")}
                </span>
                <span className="text-2xl font-bold text-muted-foreground/40">d</span>
                <span className="text-5xl font-extrabold tabular-nums tracking-tight nuvio-gradient-text">
                  {String(remaining.h).padStart(2, "0")}
                </span>
                <span className="text-2xl font-bold text-muted-foreground/40">h</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold tabular-nums text-foreground/70">
                  {String(remaining.m).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-muted-foreground/40">m</span>
                <span className="text-2xl font-bold tabular-nums text-foreground/70">
                  {String(remaining.s).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-muted-foreground/40">s</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-2">
                Trial Remaining
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOLID CARD — clean, opaque, subtle shadow (NOT glass)
// ═══════════════════════════════════════════════════════════════

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`nuvio-solid-card rounded-2xl p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconColor = "text-violet-400" }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] ${iconColor}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <h2 className="text-sm font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COPY FIELD
// ═══════════════════════════════════════════════════════════════

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.12]">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 flex items-center gap-1.5">
          <Icon className="h-3 w-3" /> {label}
        </p>
        <code className="text-sm font-mono text-foreground truncate block">{value}</code>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`}
        className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-90 ${
          copied ? "bg-green-500/15 text-green-400" : "bg-white/[0.06] text-foreground/50 hover:bg-white/[0.12] hover:text-foreground"
        }`}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REFERRAL CARD
// ═══════════════════════════════════════════════════════════════

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
        c = "NUVRIO-" + Array.from({ length: 6 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
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
    <Card>
      <SectionHeader icon={Gift} title="Refer & earn" subtitle="Give 7 days, get 7 days" iconColor="text-pink-400" />
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Share your link. When a friend starts their free trial, you both get 7 extra days.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <p className="text-[9px] text-muted-foreground/60 mb-0.5 uppercase tracking-wider">Your link</p>
          <p className="text-xs font-mono truncate text-foreground/90">{mounted ? link : "loading…"}</p>
        </div>
        <button type="button" onClick={copyLink}
          className="nuvio-gradient-bg inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform">
          {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// SAVINGS CARD
// ═══════════════════════════════════════════════════════════════

function SavingsCard() {
  return (
    <Card>
      <SectionHeader icon={TrendingDown} title="You're saving" subtitle="vs. subscribing separately" iconColor="text-green-400" />
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-4xl font-extrabold text-green-400 tabular-nums">₱2,600</span>
        <span className="text-sm text-muted-foreground">/year</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400">98% less</span>
        <span className="text-xs text-muted-foreground">than Netflix + Disney+ + HBO + Prime</span>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE COMPARISON
// ═══════════════════════════════════════════════════════════════

const FEATURES = [
  { label: "Movies & series", nuvio: "10,000+", others: "1,000–2,000" },
  { label: "Live TV channels", nuvio: "Included", others: "Not included" },
  { label: "Anime library", nuvio: "Included", others: "Extra $7.99/mo" },
  { label: "Pinoy content", nuvio: "Full library", others: "Limited" },
  { label: "Full HD streaming", nuvio: true, others: true },
  { label: "GCash / Maya", nuvio: true, others: false },
  { label: "Price/month", nuvio: "₱49", others: "₱400–650" },
];

function FeatureComparison() {
  return (
    <Card>
      <SectionHeader icon={Star} title="Why you'll love staying" subtitle="Nuvio vs. the rest" iconColor="text-violet-400" />
      <div className="space-y-0">
        {FEATURES.map((f, i) => (
          <div key={f.label} className={`flex items-center justify-between gap-3 py-3 ${i < FEATURES.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
            <span className="text-sm text-foreground/80">{f.label}</span>
            <span className="text-sm font-bold text-green-400 text-right">
              {f.nuvio === true ? <Check className="h-4 w-4 inline" /> : f.nuvio}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHANNELS PREVIEW
// ═══════════════════════════════════════════════════════════════

function ChannelsPreview() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? CHANNELS : CHANNELS.slice(0, 12);
  return (
    <Card>
      <SectionHeader icon={Tv} title="Your channels" subtitle={`${CHANNELS.length} included`} iconColor="text-violet-400" />
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
        {visible.map((c) => <ChannelMini key={c.name} channel={c} />)}
      </div>
      {CHANNELS.length > 12 && (
        <button type="button" onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-center text-sm font-semibold text-violet-400 hover:text-violet-300 transition">
          {showAll ? "Show less" : `Show all ${CHANNELS.length} channels →`}
        </button>
      )}
    </Card>
  );
}

function ChannelMini({ channel }: { channel: (typeof CHANNELS)[number] }) {
  const [errored, setErrored] = useState(false);
  const colors = ["#7c3aed", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const color = colors[channel.name.length % colors.length];
  return (
    <div className="aspect-square rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center p-2 overflow-hidden transition-colors hover:border-white/[0.12]">
      {errored ? (
        <div className="flex h-full w-full items-center justify-center rounded-md" style={{ backgroundColor: color }}>
          <span className="text-[10px] font-bold text-white text-center px-1 line-clamp-2">{channel.name}</span>
        </div>
      ) : (
        <img src={channel.logo} alt={channel.name} loading="lazy" onError={() => setErrored(true)}
          className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RENEWAL PLANS
// ═══════════════════════════════════════════════════════════════

const PLANS = [
  { days: 30, price: 49, perDay: "1.63", popular: false },
  { days: 90, price: 129, perDay: "1.43", popular: true },
  { days: 60, price: 89, perDay: "1.48", popular: false },
];

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
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
        <Card className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 mb-4">
            <Mail className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Verify your email</h1>
          <p className="text-sm text-muted-foreground mb-5">
            We sent a verification link to <span className="font-semibold text-foreground">{user.email}</span>. Click it to unlock your dashboard.
          </p>
          <button onClick={async () => {
            await fetch("/api/send-verification", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, uid: user.uid }),
            });
          }} className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold hover:bg-white/[0.06] transition">
            Resend verification email
          </button>
          <button onClick={signOut} className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground">Log out</button>
        </Card>
      </main>
    );
  }

  if (!profile) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></main>;
  }

  const isExpired = profile.expiresAt
    ? profile.expiresAt.toDate().getTime() < Date.now()
    : false;

  return (
    <main className="min-h-screen pt-20 pb-12 px-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-5xl">
        {/* ─── TOP BAR ─── */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/mascot/nuvio-mascot.png" alt="" className="h-10 w-auto shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Welcome back</p>
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {profile.email?.split("@")[0] || "Nuvio User"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" aria-label="Home"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition">
              <Home className="h-4 w-4" />
            </Link>
            <button onClick={signOut} aria-label="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── HERO: Circular Timer + Status ─── */}
        <Card className="mb-4 flex flex-col items-center py-8 sm:py-10">
          {isExpired ? (
            <>
              <div className="flex flex-col items-center text-center max-w-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/15 mb-4">
                  <Heart className="h-8 w-8 text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold text-pink-300 mb-2">We missed you 💜</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Your free trial has ended, but Nuvio is still here for you. Renew now to instantly unlock everything again — your watchlist is waiting.
                </p>
                <a href="#renew"
                  className="nuvio-gradient-bg inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white active:scale-95 transition-transform">
                  <Crown className="h-4 w-4" /> Renew now
                </a>
              </div>
            </>
          ) : (
            <>
              <CircularTimer expiresAt={profile.expiresAt} />
              <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                Full access to everything. No card needed yet.
              </p>
            </>
          )}
        </Card>

        {/* ─── QUICK STATS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { Icon: Film, value: "10,000+", label: "Titles" },
            { Icon: Tv, value: "Full HD", label: "Quality" },
            { Icon: Zap, value: "2 min", label: "Setup" },
            { Icon: Shield, value: "Secure", label: "Payment" },
          ].map(({ Icon, value, label }) => (
            <Card key={label} className="p-4 text-center">
              <Icon className="h-5 w-5 mx-auto text-violet-400 mb-1.5" />
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        {/* ─── CREDENTIALS ─── */}
        <Card className="mb-4">
          <SectionHeader icon={Key} title="Your login" subtitle="Keep these safe" iconColor="text-pink-400" />
          <CopyField label="Email" value={profile.email || user.email || "—"} icon={Mail} />
        </Card>

        {/* ─── SAVINGS + REFERRAL ─── */}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <SavingsCard />
          <ReferralCard />
        </div>

        {/* ─── CHANNELS ─── */}
        <div className="mb-4">
          <ChannelsPreview />
        </div>

        {/* ─── FEATURE COMPARISON ─── */}
        <div className="mb-4">
          <FeatureComparison />
        </div>

        {/* ─── RENEWAL PLANS ─── */}
        <div id="renew" className="scroll-mt-20 mb-4">
          <Card>
            <SectionHeader icon={Crown} title={isExpired ? "Renew your subscription" : "Keep the magic going"} subtitle="Payment coming soon" iconColor="text-amber-400" />
            <div className="grid sm:grid-cols-3 gap-3">
              {PLANS.map((plan) => (
                <div key={plan.days} className={`relative rounded-xl border p-4 transition-all ${
                  plan.popular
                    ? "border-violet-500/30 bg-gradient-to-br from-violet-500/[0.06] to-pink-500/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}>
                  {plan.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full nuvio-gradient-bg px-2 py-0.5 text-[9px] font-bold text-white">
                      <Sparkles className="h-2.5 w-2.5" /> BEST VALUE
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">{plan.days} days</p>
                  <p className="mt-1 text-2xl font-extrabold">₱{plan.price}</p>
                  <p className="mt-0.5 text-xs text-green-400">₱{plan.perDay}/day</p>
                  <button className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold transition active:scale-95 ${
                    plan.popular ? "nuvio-gradient-bg text-white" : "border border-white/[0.08] bg-white/[0.03] text-foreground hover:bg-white/[0.06]"
                  }`}>
                    Coming soon
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="text-center pt-2 pb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
