"use client";

import { useState, useCallback } from "react";
import type { NuvioMovie } from "@/lib/nuvio";
import { Navbar } from "@/components/nuvio/navbar";
import { Hero } from "@/components/nuvio/hero";
import { MovieRow } from "@/components/nuvio/movie-row";
import { SeriesRow } from "@/components/nuvio/series-row";
import { AnimeRow } from "@/components/nuvio/anime-row";
import { RtFreshRow } from "@/components/nuvio/rt-fresh-row";
import { GenreBrowser } from "@/components/nuvio/genre-browser";
import { RecentlyViewed } from "@/components/nuvio/recently-viewed";
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

  // Wrap openMovie to dispatch a global event for the recently-viewed tracker
  const openMovie = useCallback((m: NuvioMovie) => {
    setSelected(m);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<NuvioMovie>("nuvio:view-movie", { detail: m })
      );
    }
  }, []);

  return (
    <>
      <Navbar onOpenMovie={openMovie} />
      <Hero movies={movies} onOpenMovie={openMovie} />
      <RecentlyViewed onOpenMovie={openMovie} />
      <MovieRow movies={movies} onOpenMovie={openMovie} />
      <RtFreshRow movies={rtFresh} onOpenMovie={openMovie} />
      <SeriesRow series={series} onOpenMovie={openMovie} />
      <AnimeRow anime={anime} onOpenMovie={openMovie} />
      <GenreBrowser
        initialMovies={initialGenreMovies}
        onOpenMovie={openMovie}
      />
      <MovieModal
        movie={selected}
        onClose={() => setSelected(null)}
        onOpenMovie={openMovie}
      />
    </>
  );
}
