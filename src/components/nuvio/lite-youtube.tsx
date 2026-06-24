"use client";

import { useEffect, useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface LiteYouTubeProps {
  /** YouTube video ID */
  id: string;
  title: string;
  /** When true, auto-loads the iframe 500ms after mount (used in modal). */
  autoPlay?: boolean;
}

/**
 * Lightweight YouTube embed: shows a thumbnail + play button, loads the
 * iframe after the user clicks (or auto-plays if `autoPlay` is set).
 * Keeps the modal instant while still surfacing the trailer prominently.
 */
export function LiteYouTube({ id, title, autoPlay = false }: LiteYouTubeProps) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-play: load iframe shortly after mount so the modal opens instantly
  // but the trailer starts without requiring an extra click.
  useEffect(() => {
    if (!autoPlay) return;
    setLoading(true);
    const t = setTimeout(() => {
      setActive(true);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [autoPlay, id]);

  if (active) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play trailer for ${title}`}
      className="group relative aspect-video w-full overflow-hidden rounded-xl ring-1 ring-white/10 cursor-pointer block"
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt={`${title} trailer thumbnail`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-xl">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Loading trailer…
            </span>
          </>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-xl shadow-violet-900/40 transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 fill-current" />
            </span>
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Watch trailer
            </span>
          </>
        )}
      </div>
    </button>
  );
}
