"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Star, Play } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";

interface SearchBarProps {
  onOpenMovie?: (m: NuvioMovie) => void;
}

export function SearchBar({ onOpenMovie }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NuvioMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape; open on ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K opens search
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}&limit=12`,
        { signal: ac.signal }
      )
        .then((r) => r.json())
        .then((d: { movies: NuvioMovie[] }) => setResults(d.movies ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (m: NuvioMovie) => {
    onOpenMovie?.(m);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        aria-label="Search titles"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-mono text-muted-foreground/60">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setQuery("");
              setResults([]);
            }}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-xl mx-4 nuvio-card rounded-2xl overflow-hidden shadow-2xl shadow-black/50 nuvio-rise">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, series, anime…"
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
                aria-label="Search query"
              />
              {loading && (
                <Loader2 className="h-5 w-5 animate-spin text-violet-400 shrink-0" />
              )}
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Results */}
            <div
              className="max-h-[50vh] overflow-y-auto nuvio-no-scrollbar"
              role="region"
              aria-label="Search results"
            >
              {/* Screen-reader live region */}
              <span className="sr-only" aria-live="polite">
                {loading
                  ? "Searching"
                  : query.trim().length >= 2
                    ? results.length === 0
                      ? `No results for ${query}`
                      : `${results.length} result${results.length === 1 ? "" : "s"} for ${query}`
                    : ""}
              </span>
              {query.trim().length >= 2 && results.length === 0 && !loading && (
                <div className="flex flex-col items-center py-10 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
              {results.length > 0 && (
                <ul className="py-2">
                  {results.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(m)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
                      >
                        <img
                          src={m.poster}
                          alt=""
                          width={36}
                          height={54}
                          className="h-[54px] w-[36px] rounded-md object-cover ring-1 ring-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">
                            {m.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {m.year ?? "—"}
                            {m.genres[0] ? ` · ${m.genres[0]}` : ""}
                            {m.imdbRating && (
                              <span className="ml-2 inline-flex items-center gap-0.5 text-yellow-300">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {m.imdbRating}
                              </span>
                            )}
                          </p>
                        </div>
                        <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length < 2 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Search className="h-7 w-7 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Type at least 2 characters to search
                  </p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span>Powered by Stremio</span>
              <span className="flex items-center gap-2">
                <kbd className="inline-flex h-4 items-center rounded border border-white/10 bg-white/5 px-1 font-mono">
                  ESC
                </kbd>{" "}
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
