"use client";

import { useState } from "react";
import type { NuvioMovie } from "@/lib/nuvio";
import { Hero } from "@/components/nuvio/hero";
import { MovieRow } from "@/components/nuvio/movie-row";
import { SeriesRow } from "@/components/nuvio/series-row";
import { GenreBrowser } from "@/components/nuvio/genre-browser";
import { MovieModal } from "@/components/nuvio/movie-modal";

interface NuvioMovieSectionsProps {
  movies: NuvioMovie[];
  series: NuvioMovie[];
  /** Pre-fetched movies for the first genre (Action) — avoids a loading flash. */
  initialGenreMovies: NuvioMovie[];
}

/**
 * Client orchestrator for the movie-related interactive sections.
 * Holds the modal open-state so server-fetched movies can be passed in
 * while still allowing click-to-open behavior on the client.
 */
export function NuvioMovieSections({
  movies,
  series,
  initialGenreMovies,
}: NuvioMovieSectionsProps) {
  const [selected, setSelected] = useState<NuvioMovie | null>(null);

  return (
    <>
      <Hero movies={movies} onOpenMovie={setSelected} />
      <MovieRow movies={movies} onOpenMovie={setSelected} />
      <SeriesRow series={series} onOpenMovie={setSelected} />
      <GenreBrowser
        initialMovies={initialGenreMovies}
        onOpenMovie={setSelected}
      />
      <MovieModal movie={selected} onClose={() => setSelected(null)} />
    </>
  );
}
