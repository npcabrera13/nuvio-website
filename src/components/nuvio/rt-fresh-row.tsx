"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Play, Award } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";
import { useScrollerKeyboard } from "@/components/nuvio/use-scroller-keyboard";

interface RtFreshRowProps {
  movies: NuvioMovie[];
  onOpenMovie?: (m: NuvioMovie) => void;
}

export function RtFreshRow({ movies, onOpenMovie }: RtFreshRowProps) {
  const scroller = useRef<HTMLDivElement>(null);
  useScrollerKeyboard(scroller);
  const list = movies.slice(0, 18);

  if (list.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 720), behavior: "smooth" });
  };

  return (
    <section className="relative py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Rotten Tomatoes Certified Fresh
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              New &amp; Trending
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 active:scale-95 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 active:scale-95 transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          tabIndex={0}
          role="listbox"
          aria-label="Rotten Tomatoes Certified Fresh movies"
          className="nuvio-no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 rounded-xl"
        >
          {list.map((m) => (
            <article
              key={m.id}
              className="group relative w-[150px] sm:w-[170px] lg:w-[185px] shrink-0"
            >
              <button
                type="button"
                onClick={() => onOpenMovie?.(m)}
                aria-label={`View details for ${m.name}`}
                className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 cursor-pointer block text-left"
              >
                <img
                  src={m.poster}
                  alt={m.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* RT Fresh badge */}
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black backdrop-blur-sm">
                  <Award className="h-2.5 w-2.5" /> FRESH
                </span>
                {m.imdbRating && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-yellow-300 backdrop-blur-sm ring-1 ring-white/10">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {m.imdbRating}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-lg">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                </div>
              </button>
              <div className="mt-2.5 px-0.5">
                <h3 className="text-sm font-semibold line-clamp-1">{m.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.year ?? "—"}{m.genres[0] ? ` · ${m.genres[0]}` : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
