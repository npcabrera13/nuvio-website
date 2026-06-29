"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { CHANNELS, type NuvioMovie } from "@/lib/nuvio";
import {
  Loader2, Copy, Check, LogOut, Clock, Mail, Sparkles,
  Tv, Film, ChevronRight, Crown, Gift, Key,
  Heart, Star, Home, Play, Flame, Bookmark, BookmarkCheck,
  Search, Zap, ArrowRight, CheckCircle2, Users
} from "lucide-react";
import { Timestamp, doc, updateDoc } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CIRCULAR COUNTDOWN — compact, with glow
// ═══════════════════════════════════════════════════════════════

function CircularTimer({ expiresAt, size = 120 }: { expiresAt: Timestamp | null; size?: number }) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0, pct: 0 });
  const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => {
      const diff = expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) { setRemaining({ d:0,h:0,m:0,s:0,pct:0 }); return; }
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

  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (remaining.pct / 100) * circumference;
  const isExpired = remaining.d === 0 && remaining.h === 0 && remaining.m === 0 && remaining.s === 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#timer-grad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 6px rgba(236,72,153,0.5))" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isExpired ? (
          <span className="text-xs font-bold text-pink-400">Expired</span>
        ) : (
          <>
            <span className="text-xl font-extrabold tabular-nums leading-none bg-gradient-to-br from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              {remaining.d}d
            </span>
            <span className="text-[10px] font-bold tabular-nums text-foreground/50 mt-0.5">
              {String(remaining.h).padStart(2,"0")}:{String(remaining.m).padStart(2,"0")}:{String(remaining.s).padStart(2,"0")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RENEWAL HERO — the conversion centerpiece, front and center
// ═══════════════════════════════════════════════════════════════

const PLANS = [
  { id: "7", days: 7, price: 29, label: "1 week", color: "from-blue-500 to-cyan-500", popular: false },
  { id: "30", days: 30, price: 49, label: "1 month", color: "from-violet-500 to-pink-500", popular: true },
  { id: "3", days: 3, price: 19, label: "3 days", color: "from-emerald-500 to-teal-500", popular: false },
];

function RenewalHero({ isExpired, hasExistingToken }: { isExpired: boolean; hasExistingToken?: boolean }) {
  const [selected, setSelected] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const plan = PLANS[selected];

  // Reset payLoading when page is restored from bfcache (user pressed back from PayMongo)
  useEffect(() => {
    const handlePageShow = () => setPayLoading(false);
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-5">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/15 to-amber-500/10 animate-pulse-slow" />
      <div className="absolute inset-0 nuvio-grid-bg opacity-20" />
      {/* Glow orbs */}
      <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl animate-float" />
      <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl animate-float-slow" />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-bounce-subtle">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">
              {isExpired ? "Reactivate your account" : "Keep the magic going"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {isExpired ? "Renew now to unlock everything again" : "Don't lose access when your trial ends"}
            </p>
          </div>
        </div>

        {/* Plan selector — 3 buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PLANS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(i)}
              className={`relative rounded-xl p-3 text-center transition-all duration-200 ${
                selected === i
                  ? `bg-gradient-to-br ${p.color} shadow-lg scale-105`
                  : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              {p.popular && (
                <span className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold ${
                  selected === i ? "bg-white text-violet-700" : "nuvio-gradient-bg text-white"
                }`}>
                  POPULAR
                </span>
              )}
              <p className={`text-[10px] font-semibold ${selected === i ? "text-white/80" : "text-muted-foreground"}`}>{p.label}</p>
              <p className={`text-xl font-extrabold ${selected === i ? "text-white" : "text-foreground"}`}>₱{p.price}</p>
            </button>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={async () => {
            setPayLoading(true);
            setPayError("");

            // CRITICAL: Check if accounts are available BEFORE starting payment
            // BUT only if the user has no existing token (new assignment)
            // If user already has a token (renewal), skip the check
            if (!hasExistingToken) {
              try {
                const checkRes = await fetch("/api/check-accounts", {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
                });
                const checkData = await checkRes.json();
                if (!checkData.available) {
                  setPayError("All Nuvio accounts are currently taken. Please check back later.");
                  setPayLoading(false);
                  return;
                }
              } catch {
                // If check fails, proceed with payment (better to try than block)
              }
            }

            try {
              const res = await fetch("/api/paymongo/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: plan.id }),
              });
              const data = await res.json();
              if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
              } else {
                setPayError(data.error || "Failed to start payment");
                setPayLoading(false);
              }
            } catch {
              setPayError("Network error. Please try again.");
              setPayLoading(false);
            }
          }}
          disabled={payLoading}
          className="w-full relative overflow-hidden rounded-xl py-3.5 text-sm font-extrabold text-white transition-transform active:scale-[0.98] group disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center justify-center gap-2">
            {payLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to payment…</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isExpired ? "Reactivate now" : `Continue for ₱${plan.price}`}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
        {payError && <p className="mt-2 text-center text-xs text-red-400">{payError}</p>}

        {/* Trust badges */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> GCash</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> Maya</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> Credit card</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MOVIE CARD
// ═══════════════════════════════════════════════════════════════

function MovieCard({ movie, onOpen, saved, onToggleSave }: {
  movie: NuvioMovie;
  onOpen: (m: NuvioMovie) => void;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  return (
    <div className="group relative shrink-0 w-28 sm:w-32">
      <button onClick={() => onOpen(movie)} className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-white/5 block transition-all duration-300 group-hover:ring-2 group-hover:ring-violet-500/50">
        <img src={movie.poster} alt={movie.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
        {movie.imdbRating && (
          <span className="absolute top-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-yellow-300 backdrop-blur-sm">
            ★ {movie.imdbRating}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-6 w-6 fill-white text-white" />
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSave(movie.id); }}
        aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
        className={`absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-sm transition ${
          saved ? "bg-violet-500 text-white" : "bg-black/60 text-white/70 opacity-0 group-hover:opacity-100"
        }`}
      >
        {saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
      </button>
      <p className="mt-1.5 text-[11px] font-semibold line-clamp-1">{movie.name}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTENT ROW
// ═══════════════════════════════════════════════════════════════

function ContentRow({ title, icon: Icon, movies, onOpen, savedIds, onToggleSave, accent }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  movies: NuvioMovie[];
  onOpen: (m: NuvioMovie) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  accent?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  if (movies.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <Icon className={`h-4 w-4 ${accent || "text-violet-400"}`} /> {title}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} aria-label="Scroll left"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div ref={scroller} className="nuvio-no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} onOpen={onOpen} saved={savedIds.has(m.id)} onToggleSave={onToggleSave} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURED HERO — movie backdrop
// ═══════════════════════════════════════════════════════════════

function FeaturedHero({ movie, onOpen }: { movie: NuvioMovie; onOpen: (m: NuvioMovie) => void }) {
  return (
    <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => onOpen(movie)}>
      <img src={movie.background} alt={movie.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-5 max-w-md">
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white mb-2 shadow-lg">
          <Flame className="h-2.5 w-2.5" /> TRENDING NOW
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-white drop-shadow-lg">{movie.name}</h2>
        <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
          {movie.imdbRating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{movie.imdbRating}</span>}
          {movie.year && <span>· {movie.year}</span>}
          {movie.genres[0] && <span>· {movie.genres[0]}</span>}
        </div>
      </div>
      <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="h-4 w-4 fill-current" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHANNEL STRIP
// ═══════════════════════════════════════════════════════════════

function ChannelStrip() {
  return (
    <div>
      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2.5">
        <Tv className="h-4 w-4 text-cyan-400" /> Live channels
      </h3>
      <div className="nuvio-no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CHANNELS.map((c, i) => <ChannelPill key={c.name} channel={c} index={i} />)}
      </div>
    </div>
  );
}

function ChannelPill({ channel, index }: { channel: (typeof CHANNELS)[number]; index: number }) {
  const [errored, setErrored] = useState(false);
  const colors = ["#7c3aed","#ec4899","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];
  return (
    <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-transform hover:scale-110">
      {errored ? (
        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: colors[index % colors.length] }}>
          <span className="text-[8px] font-bold text-white">{channel.name.slice(0,3)}</span>
        </div>
      ) : (
        <img src={channel.logo} alt={channel.name} loading="lazy" onError={() => setErrored(true)} className="max-h-full max-w-full object-contain p-1" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COPY FIELD — individual field with copy button
// ═══════════════════════════════════════════════════════════════

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 min-w-0 transition-colors hover:border-white/[0.12]">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5 flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</p>
        <code className="text-sm font-mono text-foreground truncate block min-w-0">{value}</code>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`}
        className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90 ${
          copied ? "bg-green-500/15 text-green-400" : "bg-white/[0.06] text-foreground/50 hover:bg-white/[0.12] hover:text-foreground"
        }`}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export function DashboardClient({ movies, series }: { movies: NuvioMovie[]; series: NuvioMovie[] }) {
  const router = useRouter();
  const { user, profile, loading, signOut, refreshProfile, assignTokenAfterPayment } = useAuth();
  const redirected = useRef(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [copiedBoth, setCopiedBoth] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "failed" | null>(null);

  // Handle PayMongo payment redirect: /dashboard?payment=success&plan=30
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const plan = params.get("plan");
    if (!status || !user) return;
    // For "verified-no-trial" users, profile is null — that's OK, we handle it below
    // For existing users, we need profile.tokenId

    if (status === "success" && plan) {
      setPaymentStatus("processing");
      const daysToAdd = parseInt(plan, 10);
      const now = new Date();

      // Clear URL immediately to prevent infinite loop on back button
      window.history.replaceState(null, "", "/dashboard/");

      // Case 1: User has NO active token (profile is null, verified-no-trial, deleted, etc.)
      // Assign a NEW token with the plan days as the expiry.
      if (!profile?.tokenId) {
        (async () => {
          try {
            await assignTokenAfterPayment(daysToAdd);
            setPaymentStatus("success");
          } catch (err: any) {
            console.error("Failed to assign token after payment:", err);
            if (err?.message === "ACCOUNTS_FULL") {
              setPaymentStatus("failed");
              setPayError("All Nuvio accounts are currently taken. Please contact support for a refund.");
            } else {
              setPaymentStatus("failed");
            }
          }
        })();
      }
      // Case 2: User already has a token — extend the expiry.
      else if (profile?.tokenId) {
        const currentExpiry = profile.expiresAt ? profile.expiresAt.toDate() : now;
        const base = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
        const newExpiry = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        (async () => {
          try {
            await updateDoc(doc(db, "customers", profile.tokenId), {
              expiresAt: Timestamp.fromDate(newExpiry),
              status: "active",
            });
            await refreshProfile();
            setPaymentStatus("success");
          } catch (err) {
            console.error("Failed to extend subscription:", err);
            setPaymentStatus("failed");
          }
        })();
      }
    } else if (status === "failed") {
      setPaymentStatus("failed");
      window.history.replaceState(null, "", "/dashboard/");
    }
  }, [user, profile, refreshProfile, assignTokenAfterPayment]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nuvio-watchlist");
      if (raw) setSavedIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("nuvio-watchlist", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const openMovie = (m: NuvioMovie) => {
    try { sessionStorage.setItem("nuvio-open-movie", JSON.stringify(m)); } catch {}
    router.push(`/?open=${m.id}`);
  };

  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>;
  }

  // User is logged in but has NO token assigned (displayName is empty or "verified-no-trial").
  // ALWAYS show the pay screen — no verify gate.
  // The verification email is still sent on signup, but the dashboard doesn't block them.
  // If they pay, they get a token (paying proves they're real).
  // If they verify first, they get a free trial token.
  if (!user.displayName || user.displayName === "verified-no-trial") {
    return (
      <main className="min-h-screen pt-20 pb-12 px-3 sm:px-4 lg:px-6 relative">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/12 blur-[140px] animate-float" />
          <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-pink-500/10 blur-[140px] animate-float-slow" />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 mb-4">
              <Sparkles className="h-7 w-7 text-violet-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome to Nuvio</h1>
            <p className="text-sm text-muted-foreground">
              Pick a plan below to get instant access. Or verify your email for a 7-day free trial.
            </p>
          </div>
          <RenewalHero isExpired={true} hasExistingToken={false} />
          <div className="text-center mt-3">
            <button
              onClick={async () => {
                const btn = document.getElementById("resend-btn-2");
                if (btn) { btn.textContent = "Sending…"; btn.setAttribute("disabled", "true"); }
                try {
                  const res = await fetch("/api/send-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email, uid: user.uid }),
                  });
                  const data = await res.json();
                  if (btn) {
                    btn.textContent = data.success ? "Email sent!" : "Failed";
                    setTimeout(() => { if (btn) { btn.textContent = "Resend verification email"; btn.removeAttribute("disabled"); } }, 3000);
                  }
                } catch {
                  if (btn) { btn.textContent = "Failed"; setTimeout(() => { if (btn) { btn.textContent = "Resend verification email"; btn.removeAttribute("disabled"); } }, 3000); }
                }
              }}
              id="resend-btn-2"
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition"
            >
              Resend verification email
            </button>
          </div>
          <div className="text-center mt-3">
            <button onClick={signOut} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
              <LogOut className="h-3 w-3" /> Log out
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    // Profile couldn't be loaded — token was deleted/unassigned/reassigned
    // Show pay screen so user can get a new account
    return (
      <main className="min-h-screen pt-20 pb-12 px-3 sm:px-4 lg:px-6 relative">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/12 blur-[140px] animate-float" />
          <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-pink-500/10 blur-[140px] animate-float-slow" />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 mb-4">
              <Users className="h-7 w-7 text-amber-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Choose a plan</h1>
            <p className="text-sm text-muted-foreground">
              Pick a plan below to get instant access to a Nuvio account.
            </p>
          </div>
          <RenewalHero isExpired={true} hasExistingToken={false} />
          <div className="text-center mt-5">
            <button onClick={signOut} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
              <LogOut className="h-3 w-3" /> Log out
            </button>
          </div>
        </div>
      </main>
    );
  }

  // No token assigned — accounts were full when they verified
  if (!profile.tokenId || !profile.nuvioEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="nuvio-solid-card rounded-2xl p-6 max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 mb-4">
            <Users className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">No account assigned yet</h1>
          <p className="text-sm text-muted-foreground mb-5">
            All Nuvio accounts are currently assigned to other users. New accounts are
            added regularly — please check back soon.
          </p>
          <button onClick={signOut} className="inline-flex items-center justify-center rounded-xl nuvio-gradient-bg px-5 py-2.5 text-sm font-semibold text-white">
            Log out
          </button>
        </div>
      </main>
    );
  }

  const isExpired = profile.expiresAt ? profile.expiresAt.toDate().getTime() < Date.now() : false;
  const featured = movies[0];
  const savedMovies = movies.filter((m) => savedIds.has(m.id));

  return (
    <main className="min-h-screen pt-20 pb-12 px-3 sm:px-4 lg:px-6 relative">
      {/* Ambient colorful background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/12 blur-[140px] animate-float" />
        <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-pink-500/10 blur-[140px] animate-float-slow" />
        <div className="absolute bottom-0 left-1/4 h-[24rem] w-[24rem] rounded-full bg-cyan-500/8 blur-[140px] animate-float" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] rounded-full bg-amber-500/6 blur-[120px] animate-float-slow" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* ─── TOP BAR ─── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-extrabold text-sm shrink-0 shadow-lg shadow-violet-500/20">
              {(profile.email?.[0] || "N").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Welcome back</p>
              <h1 className="text-base sm:text-lg font-bold truncate">{profile.email?.split("@")[0] || "User"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="Home" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground transition">
              <Home className="h-4 w-4" />
            </Link>
            <button onClick={signOut} aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-red-400 transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── ROW 1: Timer + Featured ─── */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-3 mb-4">
          <div className="nuvio-solid-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <CircularTimer expiresAt={profile.expiresAt} size={120} />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {isExpired ? "Expired" : "Trial left"}
            </p>
            {!isExpired && <p className="text-[10px] text-green-400 mt-0.5 flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-green-400 animate-pulse" /> Active</p>}
          </div>
          {featured && <FeaturedHero movie={featured} onOpen={openMovie} />}
        </div>

        {/* ─── ROW 2: RENEWAL HERO (front and center!) ─── */}
        <RenewalHero isExpired={isExpired} hasExistingToken={true} />

        {/* ─── NUVIO CREDENTIALS (right below payment options, easy to find) ─── */}
        <div className="nuvio-solid-card rounded-2xl p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-400 ring-1 ring-violet-500/20">
              <Key className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold">Your Nuvio account</h3>
              <p className="text-[10px] text-muted-foreground">Log in at nuvio.tv with these</p>
            </div>
          </div>
          <div className="space-y-2">
            <CopyField label="Nuvio email" value={profile.nuvioEmail} icon={Mail} />
            <CopyField label="Nuvio password" value={profile.nuvioPassword || "••••••••"} icon={Key} />
          </div>
          {/* Copy both button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(`Email: ${profile.nuvioEmail}\nPassword: ${profile.nuvioPassword}`);
              setCopiedBoth(true);
              setTimeout(() => setCopiedBoth(false), 2000);
            }}
            className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
              copiedBoth
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : "nuvio-gradient-bg text-white"
            }`}
          >
            {copiedBoth ? <><Check className="h-3.5 w-3.5" /> Copied both!</> : <><Copy className="h-3.5 w-3.5" /> Copy email + password</>}
          </button>
        </div>

        {/* ─── EXPIRED BANNER ─── */}
        {isExpired && (
          <div className="nuvio-solid-card rounded-2xl p-4 mb-4 border-pink-500/20 flex items-center gap-3">
            <Heart className="h-5 w-5 text-pink-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-pink-300">We missed you 💜</p>
              <p className="text-xs text-muted-foreground">Renew above to unlock everything again.</p>
            </div>
          </div>
        )}

        {/* ─── GO TO NUVIO.TV (prominent with logo) ─── */}
        <a href="https://nuvio.tv" target="_blank" rel="noopener noreferrer" className="relative overflow-hidden rounded-2xl p-5 flex items-center justify-center gap-4 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-violet-900/40 mb-5 animate-pulse-slow" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          <img src="https://nuvio.tv/assets/Logo_1080x1080.png" alt="Nuvio" className="h-10 w-10 rounded-lg shrink-0" />
          <div className="text-center">
            <span className="block text-lg font-extrabold text-white">Go to nuvio.tv</span>
            <span className="block text-[10px] text-white/70">Start streaming now →</span>
          </div>
        </a>

        {/* ─── LIVE CHANNELS ─── */}
        <div className="mb-5">
          <ChannelStrip />
        </div>

        {/* ─── ACCOUNT + REFERRAL ─── */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <div className="nuvio-solid-card rounded-2xl p-4">
            <h3 className="text-sm font-bold mb-2.5 flex items-center gap-1.5"><Mail className="h-4 w-4 text-pink-400" /> Website login</h3>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2 min-w-0">
              <code className="text-xs font-mono text-foreground/70 truncate min-w-0">{profile.email}</code>
              <button onClick={() => navigator.clipboard.writeText(profile.email || "")}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-foreground/50 hover:bg-white/[0.12] hover:text-foreground transition">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <ReferralInline />
        </div>

        {/* ─── FOOTER ─── */}
        <div className="text-center pb-4 flex items-center justify-center gap-4">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <ChevronRight className="h-3 w-3 rotate-180" /> Back to home
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <LogOut className="h-3 w-3" /> Log out
          </button>
        </div>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE REFERRAL
// ═══════════════════════════════════════════════════════════════

function ReferralInline() {
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
    } catch {}
  }, []);

  const link = mounted ? `${window.location.origin}/?ref=${code}` : "";
  return (
    <div className="nuvio-solid-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="h-4 w-4 text-pink-400" />
        <p className="text-sm font-bold">Refer & earn</p>
        <span className="ml-auto text-[9px] text-green-400 font-semibold">+7 days each</span>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2">
        <p className="text-xs font-mono text-foreground/70 truncate">{mounted ? link : "..."}</p>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-foreground/50 hover:bg-white/[0.12] hover:text-foreground transition">
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
