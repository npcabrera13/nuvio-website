"use client";

import { useState } from "react";
import type { NuvioMovie } from "@/lib/nuvio";
import { Hero } from "@/components/nuvio/hero";
import { MovieRow } from "@/components/nuvio/movie-row";
import { MovieModal } from "@/components/nuvio/movie-modal";

/**
 * Client orchestrator for the movie-related interactive sections.
 * Holds the modal open-state so server-fetched movies can be passed in
 * while still allowing click-to-open behavior on the client.
 */
export function NuvioMovieSections({ movies }: { movies: NuvioMovie[] }) {
  const [selected, setSelected] = useState<NuvioMovie | null>(null);

  return (
    <>
      <Hero movies={movies} onOpenMovie={setSelected} />
      <MovieRow movies={movies} onOpenMovie={setSelected} />
      <MovieModal movie={selected} onClose={() => setSelected(null)} />
    </>
  );
}
