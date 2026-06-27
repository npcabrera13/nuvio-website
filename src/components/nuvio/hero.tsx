"use client";

import { useEffect, useRef, useState } from "react";
import { Play, ChevronRight, Sparkles, Star } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";

interface HeroProps {
  movies: NuvioMovie[];
  onOpenMovie?: (m: NuvioMovie) => void;
}

export function Hero({ movies, onOpenMovie }: HeroProps) {
  const top5 = movies.slice(0, 5);
  const [active, setActive] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (top5.length === 0) return;
    timers.current.forEach(clearTimeout);
    const t = setTimeout(() => setActive((i) => (i + 1) % top5.length), 6000);
    timers.current.push(t);
    return () => timers.current.forEach(clearTimeout);
  }, [active, top5.length]);

  const current = top5[active];

  return (
    <section id="top" className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 lg:pb-24 overflow-hidden">
      {/* Mobile: movie carousel as background (saves space) */}
      {top5.length > 0 && (
        <div className="lg:hidden absolute inset-0 -z-10">
          {top5.map((m, i) => (
            <div
              key={m.id}
              className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
              style={{ opacity: i === active ? 0.45 : 0 }}
            >
              <img
                src={m.background}
                alt=""
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]/60" />
            </div>
          ))}
        </div>
      )}

      {/* Desktop: ambient background */}
      <div className="hidden lg:block absolute inset-0 -z-10">
        <div className="absolute inset-0 nuvio-grid-bg" />
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -top-24 right-0 h-[26rem] w-[26rem] rounded-full bg-pink-500/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Left: copy */}
        <div className="nuvio-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            7 Days Free — No Credit Card Required
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            All your streaming.
            <br />
            <span className="nuvio-gradient-text">One app. ₱49/month.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl">
            Netflix, Disney+, HBO Max, Prime Video and dozens of live channels — bundled into one streaming app. No multiple subscriptions. No multiple logins.
          </p>

          {/* Price badge */}
          <div className="mt-6 flex items-end gap-3">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">₱49</span>
            <span className="mb-1.5 text-muted-foreground font-medium">/month</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            ₱1.63 per day — less than your morning coffee
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="/signup"
              className="nuvio-gradient-bg nuvio-glow inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Get 7 Days Free
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-foreground hover:bg-white/10 active:scale-95 transition"
            >
              See Pricing
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>

          {/* Trust row */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> 4.9/5 from 2,400+ users
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Dozens of live channels
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> 10,000+ titles
            </span>
          </div>
        </div>

        {/* Right: movie carousel (desktop only) */}
        <div className="hidden lg:block relative nuvio-rise" style={{ animationDelay: "120ms" }}>
          <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-900/30">
            {/* Backdrop layers */}
            {top5.length === 0 ? (
              <div className="absolute inset-0 nuvio-shimmer relative overflow-hidden bg-white/5" />
            ) : (
              top5.map((m, i) => (
                <div
                  key={m.id}
                  className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
                  style={{ opacity: i === active ? 1 : 0 }}
                  aria-hidden={i !== active}
                >
                  <img
                    src={m.background}
                    alt={m.name}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
                </div>
              ))
            )}

            {/* Movie meta */}
            {current && (
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                  <span className="rounded bg-white/15 px-1.5 py-0.5 font-semibold">#{active + 1}</span>
                  {current.imdbRating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {current.imdbRating}
                    </span>
                  )}
                  {current.year && <span>{current.year}</span>}
                  {current.genres[0] && <span>· {current.genres[0]}</span>}
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-white line-clamp-2 drop-shadow-lg">
                  {current.name}
                </h3>
                {current.description && (
                  <p className="mt-1.5 text-sm text-white/70 line-clamp-2 hidden sm:block max-w-md">
                    {current.description}
                  </p>
                )}
                {onOpenMovie && (
                  <button
                    type="button"
                    onClick={() => onOpenMovie(current)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm ring-1 ring-white/20 hover:bg-white/25 transition-colors"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    View details
                  </button>
                )}
              </div>
            )}

            {/* Dots */}
            {top5.length > 1 && (
              <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                {top5.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setActive(i)}
                    className={`h-7 w-1.5 rounded-full transition-all ${
                      i === active ? "bg-white scale-y-125" : "bg-white/35 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Floating "now playing" pill */}
          <div className="absolute -bottom-4 -left-3 sm:-left-5 flex items-center gap-2.5 rounded-2xl nuvio-glass px-4 py-3 shadow-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500" />
            </span>
            <span className="text-xs sm:text-sm font-medium">Now streaming in Full HD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
