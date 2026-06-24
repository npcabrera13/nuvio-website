"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, History, Trash2 } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";
import { useScrollerKeyboard } from "@/components/nuvio/use-scroller-keyboard";

const STORAGE_KEY = "nuvio-recently-viewed-v1";
const MAX_ITEMS = 12;

interface RecentlyViewedProps {
  onOpenMovie?: (m: NuvioMovie) => void;
}

/**
 * Row of recently-viewed titles, persisted in localStorage.
 * Listens for the global "nuvio:view-movie" event (dispatched when the modal
 * opens a movie) and stores a compact record. Renders only on the client to
 * avoid hydration mismatch.
 */
export function RecentlyViewed({ onOpenMovie }: RecentlyViewedProps) {
  const [items, setItems] = useState<NuvioMovie[]>([]);
  const [mounted, setMounted] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useScrollerKeyboard(scroller);

  // Load from localStorage on mount + subscribe to view events
  useEffect(() => {
    setMounted(true);
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    };
    load();

    const onView = (e: Event) => {
      const movie = (e as CustomEvent<NuvioMovie>).detail;
      if (!movie?.id) return;
      setItems((prev) => {
        const filtered = prev.filter((m) => m.id !== movie.id);
        const next = [movie, ...filtered].slice(0, MAX_ITEMS);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    };

    window.addEventListener("nuvio:view-movie", onView as EventListener);
    return () =>
      window.removeEventListener("nuvio:view-movie", onView as EventListener);
  }, []);

  const clearAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setItems([]);
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(el.clientWidth * 0.85, 720),
      behavior: "smooth",
    });
  };

  // Don't render on server or if empty (avoids hydration mismatch + empty UI)
  if (!mounted || items.length === 0) return null;

  return (
    <section className="relative py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <History className="h-4 w-4" /> Pick up where you left off
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Recently Viewed
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              aria-label="Clear recently viewed"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-1)}
              className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 active:scale-95 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(1)}
              className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 active:scale-95 transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          tabIndex={0}
          role="listbox"
          aria-label="Recently viewed titles"
          className="nuvio-no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 rounded-xl"
        >
          {items.map((m) => (
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
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-violet-600/85 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  <History className="h-2.5 w-2.5" /> VIEWED
                </span>
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
