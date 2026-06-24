"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { X, Star, Play, Clock, Calendar, Users, Film } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";

interface MovieModalProps {
  movie: NuvioMovie | null;
  onClose: () => void;
}

export function MovieModal({ movie, onClose }: MovieModalProps) {
  return (
    <Dialog open={movie !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden border-white/10 bg-[#0d0d14] max-h-[92vh]">
        {movie && <ModalBody movie={movie} />}
        <DialogClose className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors ring-1 ring-white/15">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function ModalBody({ movie }: { movie: NuvioMovie }) {
  return (
    <div className="overflow-y-auto max-h-[92vh] nuvio-no-scrollbar">
      {/* Backdrop hero */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={movie.background}
          alt={movie.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 mb-2">
            {movie.imdbRating && (
              <span className="inline-flex items-center gap-1 rounded-md bg-yellow-400/20 px-2 py-1 font-semibold text-yellow-300 ring-1 ring-yellow-400/30">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {movie.imdbRating}
              </span>
            )}
            {movie.year && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1">
                <Calendar className="h-3 w-3" /> {movie.year}
              </span>
            )}
            {movie.runtime && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1">
                <Clock className="h-3 w-3" /> {movie.runtime}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
            {movie.name}
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6">
        {/* Genres */}
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {movie.genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        {movie.description && (
          <p className="text-sm leading-relaxed text-foreground/80">
            {movie.description}
          </p>
        )}

        {/* Cast */}
        {movie.cast.length > 0 && (
          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Users className="h-3.5 w-3.5" /> Cast
            </p>
            <div className="flex flex-wrap gap-2">
              {movie.cast.slice(0, 6).map((c) => (
                <span
                  key={c}
                  className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-foreground/80 ring-1 ring-white/10"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Included note */}
        <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
          <Film className="h-4 w-4 text-green-400" />
          <p className="text-xs text-green-200">
            <span className="font-semibold">Included with Nuvio.</span> Stream
            this in 1080p — no extra cost, no per-movie fee.
          </p>
        </div>

        {/* CTA */}
        <a
          href="#trial"
          className="mt-5 nuvio-gradient-bg nuvio-glow inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Play className="h-4 w-4 fill-current" />
          Start 7 Days Free to Watch
        </a>
      </div>
    </div>
  );
}
