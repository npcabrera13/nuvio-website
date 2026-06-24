"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CHANNELS, type NuvioMovie } from "@/lib/nuvio";
import {
  Loader2, Copy, Check, LogOut, Clock, Mail, Sparkles,
  Tv, Film, ChevronRight, Crown, Gift, TrendingDown,
  Heart, Star, Home, Play, Flame, Bookmark, BookmarkCheck,
  Zap, Shield, Search
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CIRCULAR COUNTDOWN — compact, beautiful
// ═══════════════════════════════════════════════════════════════

function CircularTimer({ expiresAt, size = 140 }: { expiresAt: Timestamp | null; size?: number }) {
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

  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (remaining.pct / 100) * circumference;
  const isExpired = remaining.d === 0 && remaining.h === 0 && remaining.m === 0 && remaining.s === 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#timer-grad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isExpired ? (
          <span className="text-xs font-bold text-pink-400">Expired</span>
        ) : (
          <>
            <span className="text-2xl font-extrabold tabular-nums nuvio-gradient-text leading-none">
              {remaining.d}d
            </span>
            <span className="text-xs font-bold tabular-nums text-foreground/60 mt-0.5">
              {String(remaining.h).padStart(2,"0")}:{String(remaining.m).padStart(2,"0")}:{String(remaining.s).padStart(2,"0")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURED HERO — movie backdrop with gradient overlay
// ═══════════════════════════════════════════════════════════════

function FeaturedHero({ movie, onOpen }: { movie: NuvioMovie; onOpen: (m: NuvioMovie) => void }) {
  return (
    <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => onOpen(movie)}>
      <img src={movie.background} alt={movie.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/60 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-6 max-w-md">
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-200 backdrop-blur-sm mb-2">
          <Flame className="h-2.5 w-2.5" /> TRENDING NOW
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">{movie.name}</h2>
        <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
          {movie.imdbRating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{movie.imdbRating}</span>}
          {movie.year && <span>· {movie.year}</span>}
          {movie.genres[0] && <span>· {movie.genres[0]}</span>}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="h-5 w-5 fill-current" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MOVIE CARD — compact poster with hover
// ═══════════════════════════════════════════════════════════════

function MovieCard({ movie, onOpen, saved, onToggleSave }: {
  movie: NuvioMovie;
  onOpen: (m: NuvioMovie) => void;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  return (
    <div className="group relative shrink-0 w-28 sm:w-32">
      <button onClick={() => onOpen(movie)} className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-white/5 block">
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
// SCROLLABLE ROW
// ═══════════════════════════════════════════════════════════════

function ContentRow({ title, icon: Icon, movies, onOpen, savedIds, onToggleSave }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  movies: NuvioMovie[];
  onOpen: (m: NuvioMovie) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  };
  if (movies.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-violet-400" /> {title}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} aria-label="Scroll left"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground transition">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground transition">
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
// CHANNEL STRIP — horizontal scroll of channel logos
// ═══════════════════════════════════════════════════════════════

function ChannelStrip() {
  return (
    <div>
      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3">
        <Tv className="h-4 w-4 text-violet-400" /> Live channels
      </h3>
      <div className="nuvio-no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CHANNELS.map((c) => <ChannelPill key={c.name} channel={c} />)}
      </div>
    </div>
  );
}

function ChannelPill({ channel }: { channel: (typeof CHANNELS)[number] }) {
  const [errored, setErrored] = useState(false);
  const colors = ["#7c3aed","#ec4899","#3b82f6","#10b981","#f59e0b","#ef4444"];
  return (
    <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {errored ? (
        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: colors[channel.name.length % colors.length] }}>
          <span className="text-[8px] font-bold text-white">{channel.name.slice(0,3)}</span>
        </div>
      ) : (
        <img src={channel.logo} alt={channel.name} loading="lazy" onError={() => setErrored(true)} className="max-h-full max-w-full object-contain p-1" />
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
// MAIN DASHBOARD CLIENT
// ═══════════════════════════════════════════════════════════════

export function DashboardClient({ movies, series }: { movies: NuvioMovie[]; series: NuvioMovie[] }) {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const redirected = useRef(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Load watchlist from localStorage
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

  // Open movie modal (reuse the landing page modal by dispatching event)
  const openMovie = (m: NuvioMovie) => {
    window.dispatchEvent(new CustomEvent("nuvio:view-movie", { detail: m }));
    // Navigate to home with the movie — simpler: just open in a new context
    // For now, we'll store it and redirect
    try { sessionStorage.setItem("nuvio-open-movie", JSON.stringify(m)); } catch {}
    router.push(`/?open=${m.id}`);
  };

  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>;
  }

  if (profile && !profile.emailVerified) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="nuvio-solid-card rounded-2xl p-6 max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 mb-4">
            <Mail className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Verify your email</h1>
          <p className="text-sm text-muted-foreground mb-5">We sent a link to <span className="font-semibold text-foreground">{user.email}</span>. Click it to unlock your dashboard.</p>
          <button onClick={async () => { await fetch("/api/send-verification", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email:user.email, uid:user.uid}) }); }}
            className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold hover:bg-white/[0.06] transition">Resend email</button>
          <button onClick={signOut} className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground">Log out</button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>;
  }

  const isExpired = profile.expiresAt ? profile.expiresAt.toDate().getTime() < Date.now() : false;
  const featured = movies[0];
  const savedMovies = movies.filter((m) => savedIds.has(m.id));

  return (
    <main className="min-h-screen pt-20 pb-12 px-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-6xl">
        {/* ─── TOP BAR ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl nuvio-gradient-bg text-white font-extrabold text-sm shrink-0">
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
            <button onClick={signOut} aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── HERO: Timer + Featured ─── */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-4 mb-6">
          {/* Timer card */}
          <div className="nuvio-solid-card rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <CircularTimer expiresAt={profile.expiresAt} size={130} />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {isExpired ? "Trial expired" : "Trial remaining"}
            </p>
            {!isExpired && (
              <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-green-400 animate-pulse" /> Active
              </p>
            )}
          </div>
          {/* Featured movie */}
          {featured && (
            <div>
              <FeaturedHero movie={featured} onOpen={openMovie} />
            </div>
          )}
        </div>

        {/* ─── EXPIRED BANNER (if expired) ─── */}
        {isExpired && (
          <div className="nuvio-solid-card rounded-2xl p-5 mb-6 border-pink-500/20">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-pink-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-pink-300">We missed you 💜</p>
                <p className="text-xs text-muted-foreground">Renew to unlock everything again.</p>
              </div>
              <a href="#renew" className="nuvio-gradient-bg rounded-lg px-4 py-2 text-xs font-bold text-white">Renew</a>
            </div>
          </div>
        )}

        {/* ─── QUICK ACTIONS ─── */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { Icon: Search, label: "Browse", href: "/#browse" },
            { Icon: Tv, label: "Live TV", href: "/#channels" },
            { Icon: Crown, label: "Renew", href: "#renew" },
          ].map(({ Icon, label, href }) => (
            <a key={label} href={href} className="nuvio-solid-card rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-white/15 transition">
              <Icon className="h-5 w-5 text-violet-400" />
              <span className="text-xs font-semibold">{label}</span>
            </a>
          ))}
        </div>

        {/* ─── WATCHLIST ─── */}
        {savedMovies.length > 0 && (
          <div className="mb-6">
            <ContentRow title="My watchlist" icon={BookmarkCheck} movies={savedMovies} onOpen={openMovie} savedIds={savedIds} onToggleSave={toggleSave} />
          </div>
        )}

        {/* ─── TRENDING MOVIES ─── */}
        <div className="mb-6">
          <ContentRow title="Trending movies" icon={Flame} movies={movies.slice(1, 13)} onOpen={openMovie} savedIds={savedIds} onToggleSave={toggleSave} />
        </div>

        {/* ─── TRENDING SERIES ─── */}
        {series.length > 0 && (
          <div className="mb-6">
            <ContentRow title="Popular series" icon={Tv} movies={series.slice(0, 12)} onOpen={openMovie} savedIds={savedIds} onToggleSave={toggleSave} />
          </div>
        )}

        {/* ─── LIVE CHANNELS ─── */}
        <div className="mb-6">
          <ChannelStrip />
        </div>

        {/* ─── ACCOUNT INFO ─── */}
        <div className="nuvio-solid-card rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-pink-400" /> Account
          </h3>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
            <code className="text-sm font-mono text-foreground/80 truncate">{profile.email}</code>
            <button onClick={() => navigator.clipboard.writeText(profile.email || "")}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-foreground/50 hover:bg-white/[0.12] hover:text-foreground transition">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ─── REFERRAL ─── */}
        <ReferralInline />

        {/* ─── RENEWAL ─── */}
        <div id="renew" className="scroll-mt-20 mb-6">
          <div className="nuvio-solid-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-400" /> {isExpired ? "Renew" : "Keep streaming"}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((plan) => (
                <div key={plan.days} className={`relative rounded-xl border p-3 text-center ${plan.popular ? "border-violet-500/30 bg-violet-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                  {plan.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full nuvio-gradient-bg px-2 py-0.5 text-[8px] font-bold text-white">BEST</span>}
                  <p className="text-[10px] text-muted-foreground">{plan.days}d</p>
                  <p className="text-lg font-extrabold">₱{plan.price}</p>
                  <p className="text-[9px] text-green-400">₱{plan.perDay}/day</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">GCash · Maya · Credit card — coming soon</p>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="text-center pb-4">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <ChevronRight className="h-3 w-3 rotate-180" /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE REFERRAL (compact)
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
    <div className="nuvio-solid-card rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Gift className="h-4 w-4 text-pink-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Refer & earn</p>
            <p className="text-[10px] text-muted-foreground truncate">{mounted ? link : "..."}</p>
          </div>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-foreground/50 hover:bg-white/[0.12] hover:text-foreground transition">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
