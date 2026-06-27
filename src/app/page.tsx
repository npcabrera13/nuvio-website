"use client";

import { useEffect, useState } from "react";
import { NuvioMovieSections } from "@/components/nuvio/nuvio-movie-sections";
import { ChannelsGrid } from "@/components/nuvio/channels-grid";
import { PriceComparison } from "@/components/nuvio/price-comparison";
import { PricingTiers } from "@/components/nuvio/pricing-tiers";
import { Faq } from "@/components/nuvio/faq";
import { FinalCta } from "@/components/nuvio/final-cta";
import { Footer } from "@/components/nuvio/footer";
import { ScrollUtilities } from "@/components/nuvio/scroll-utilities";
import { MobileStickyCta } from "@/components/nuvio/mobile-sticky-cta";
import { KeyboardHelp } from "@/components/nuvio/keyboard-help";
import { Reveal } from "@/components/nuvio/reveal";
import type { NuvioMovie } from "@/lib/nuvio";
import { Loader2 } from "lucide-react";

const STREMIO_API = "https://nuviostreamapi.vercel.app/nuvio_2xa56et";

function mapMeta(m: any): NuvioMovie {
  return {
    id: m.id ?? m.imdb_id ?? "",
    name: m.name ?? "Untitled",
    year: m.year ?? null,
    imdbRating: m.imdbRating && m.imdbRating !== "" ? m.imdbRating : null,
    genres: m.genres ?? m.genre ?? [],
    description: m.description ?? null,
    poster: m.poster ?? "",
    background: m.background ?? "",
    logo: m.logo ?? null,
    runtime: m.runtime ?? null,
    cast: m.cast ?? [],
    trailerYtIds: [],
  };
}

export default function Home() {
  const [movies, setMovies] = useState<NuvioMovie[]>([]);
  const [genreMovies, setGenreMovies] = useState<NuvioMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${STREMIO_API}/catalog/movie/cinemeta___top.json`).then(r => r.json()),
      fetch(`${STREMIO_API}/catalog/movie/cinemeta___top/genre=Action.json`).then(r => r.json()),
    ]).then(([topData, genreData]) => {
      const topMovies = (topData.metas || []).filter((m: any) => m.background && m.poster).map(mapMeta).slice(0, 15);
      const actionMovies = (genreData.metas || []).filter((m: any) => m.background && m.poster).map(mapMeta).slice(0, 18);
      setMovies(topMovies);
      setGenreMovies(actionMovies);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <>
      <ScrollUtilities />
      <main className="flex-1">
        <NuvioMovieSections
          movies={movies}
          series={[]}
          anime={[]}
          rtFresh={[]}
          initialGenreMovies={genreMovies}
        />
        <Reveal><ChannelsGrid /></Reveal>
        <Reveal><PriceComparison /></Reveal>
        <Reveal><PricingTiers /></Reveal>
        <Reveal><Faq /></Reveal>
        <Reveal><FinalCta /></Reveal>
      </main>
      <Footer />
      <MobileStickyCta />
      <KeyboardHelp />
    </>
  );
}
