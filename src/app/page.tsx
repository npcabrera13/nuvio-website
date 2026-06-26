import { NuvioMovieSections } from "@/components/nuvio/nuvio-movie-sections";
import { Stats } from "@/components/nuvio/stats";
import { ChannelsGrid } from "@/components/nuvio/channels-grid";
import { HowItWorks } from "@/components/nuvio/how-it-works";
import { Devices } from "@/components/nuvio/devices";
import { PriceComparison } from "@/components/nuvio/price-comparison";
import { ComparisonTable } from "@/components/nuvio/comparison-table";
import { SavingsCalculator } from "@/components/nuvio/savings-calculator";
import { PricingTiers } from "@/components/nuvio/pricing-tiers";
import { Reviews } from "@/components/nuvio/reviews";
import { Faq } from "@/components/nuvio/faq";
import { FinalCta } from "@/components/nuvio/final-cta";
import { Footer } from "@/components/nuvio/footer";
import { ScrollUtilities } from "@/components/nuvio/scroll-utilities";
import { TableOfContents } from "@/components/nuvio/table-of-contents";
import { MobileStickyCta } from "@/components/nuvio/mobile-sticky-cta";
import { CookieConsent } from "@/components/nuvio/cookie-consent";
import { KeyboardHelp } from "@/components/nuvio/keyboard-help";
import { Reveal } from "@/components/nuvio/reveal";
import {
  fetchTopMovies,
  fetchTopSeries,
  fetchTrendingAnime,
  fetchRtFreshMovies,
  fetchMoviesByGenre,
} from "@/lib/nuvio";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [movies, series, anime, rtFresh, initialGenreMovies] = await Promise.all([
    fetchTopMovies(20),
    fetchTopSeries(18),
    fetchTrendingAnime(18),
    fetchRtFreshMovies(18),
    fetchMoviesByGenre("Action", 18),
  ]);

  return (
    <>
      <ScrollUtilities />
      <TableOfContents />
      <main className="flex-1">
        <NuvioMovieSections
          movies={movies}
          series={series}
          anime={anime}
          rtFresh={rtFresh}
          initialGenreMovies={initialGenreMovies}
        />
        <Reveal><Stats /></Reveal>
        <Reveal><ChannelsGrid /></Reveal>
        <Reveal><HowItWorks /></Reveal>
        <Reveal><Devices /></Reveal>
        <Reveal><PriceComparison /></Reveal>
        <Reveal><ComparisonTable /></Reveal>
        <Reveal><SavingsCalculator /></Reveal>
        <Reveal><PricingTiers /></Reveal>
        <Reveal><Reviews /></Reveal>
        <Reveal><Faq /></Reveal>
        <Reveal><FinalCta /></Reveal>
      </main>
      <Footer />
      <MobileStickyCta />
      <CookieConsent />
      <KeyboardHelp />
    </>
  );
}
