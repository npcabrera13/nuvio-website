"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Play, Loader2, Film } from "lucide-react";
import { MOVIE_GENRES, type NuvioMovie } from "@/lib/nuvio";

interface GenreBrowserProps {
  onOpenMovie?: (m: NuvioMovie) => void;
  /** Pre-fetched initial movies for the first genre (no loading flash). */
  initialMovies: NuvioMovie[];
}

export function GenreBrowser({ onOpenMovie, initialMovies }: GenreBrowserProps) {
  const [genre, setGenre] = useState<string>(MOVIE_GENRES[0]);
  const [movies, setMovies] = useState<NuvioMovie[]>(initialMovies);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Track which genre the current `movies` state corresponds to, so we can
  // skip re-fetching the initial genre (already provided via props).
  const loadedGenreRef = useRef<string>(
    initialMovies.length > 0 ? MOVIE_GENRES[0] : ""
  );

  // On mount, read genre from URL hash if present (e.g. #browse&genre=Comedy)
  useEffect(() => {
    const match = window.location.hash.match(/genre=([A-Za-z-]+)/);
    const g = match?.[1];
    if (g && (MOVIE_GENRES as readonly string[]).includes(g) && g !== MOVIE_GENRES[0]) {
      setGenre(g);
    }
  }, []);

  // Sync genre -> URL hash (shareable links)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const expected = `#browse&genre=${genre}`;
    if (window.location.hash !== expected) {
      window.history.replaceState(null, "", expected);
    }
  }, [genre]);

  useEffect(() => {
    // No-op if we already have data for this genre.
    if (loadedGenreRef.current === genre) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    fetch(`/api/movies?genre=${encodeURIComponent(genre)}&limit=18`, {
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((d: { movies: NuvioMovie[] }) => {
        setMovies(d.movies ?? []);
        loadedGenreRef.current = genre;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [genre]);

  return (
    <section id="browse" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
              Browse the library
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Find your next obsession
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Filter 10,000+ titles by genre. Tap any poster for details.
          </p>
        </div>

        {/* Genre pills */}
        <div className="nuvio-no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-2 mb-6">
          {MOVIE_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                genre === g
                  ? "nuvio-gradient-bg text-white shadow-lg shadow-violet-900/30"
                  : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          )}
          {movies.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Film className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No titles found for {genre}. Try another genre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {movies.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOpenMovie?.(m)}
                  aria-label={`View details for ${m.name}`}
                  className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left"
                >
                  <img
                    src={m.poster}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {m.imdbRating && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur-sm ring-1 ring-white/10">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      {m.imdbRating}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-8">
                    <p className="text-[11px] sm:text-xs font-semibold text-white line-clamp-2 leading-tight">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-white/60 mt-0.5">{m.year ?? ""}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-lg">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
