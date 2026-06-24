"use client";

import { useState } from "react";
import type { NuvioMovie } from "@/lib/nuvio";
import { Navbar } from "@/components/nuvio/navbar";
import { Hero } from "@/components/nuvio/hero";
import { MovieRow } from "@/components/nuvio/movie-row";
import { SeriesRow } from "@/components/nuvio/series-row";
import { AnimeRow } from "@/components/nuvio/anime-row";
import { RtFreshRow } from "@/components/nuvio/rt-fresh-row";
import { GenreBrowser } from "@/components/nuvio/genre-browser";
import { MovieModal } from "@/components/nuvio/movie-modal";

interface NuvioMovieSectionsProps {
  movies: NuvioMovie[];
  series: NuvioMovie[];
  anime: NuvioMovie[];
  rtFresh: NuvioMovie[];
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
  anime,
  rtFresh,
  initialGenreMovies,
}: NuvioMovieSectionsProps) {
  const [selected, setSelected] = useState<NuvioMovie | null>(null);

  return (
    <>
      <Navbar onOpenMovie={setSelected} />
      <Hero movies={movies} onOpenMovie={setSelected} />
      <MovieRow movies={movies} onOpenMovie={setSelected} />
      <RtFreshRow movies={rtFresh} onOpenMovie={setSelected} />
      <SeriesRow series={series} onOpenMovie={setSelected} />
      <AnimeRow anime={anime} onOpenMovie={setSelected} />
      <GenreBrowser
        initialMovies={initialGenreMovies}
        onOpenMovie={setSelected}
      />
      <MovieModal movie={selected} onClose={() => setSelected(null)} />
    </>
  );
}
