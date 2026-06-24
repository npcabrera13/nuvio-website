import { Navbar } from "@/components/nuvio/navbar";
import { NuvioMovieSections } from "@/components/nuvio/nuvio-movie-sections";
import { Stats } from "@/components/nuvio/stats";
import { ChannelsGrid } from "@/components/nuvio/channels-grid";
import { HowItWorks } from "@/components/nuvio/how-it-works";
import { AppPreview } from "@/components/nuvio/app-preview";
import { Devices } from "@/components/nuvio/devices";
import { PriceComparison } from "@/components/nuvio/price-comparison";
import { ComparisonTable } from "@/components/nuvio/comparison-table";
import { PricingTiers } from "@/components/nuvio/pricing-tiers";
import { Reviews } from "@/components/nuvio/reviews";
import { Faq } from "@/components/nuvio/faq";
import { FinalCta } from "@/components/nuvio/final-cta";
import { Footer } from "@/components/nuvio/footer";
import { ScrollUtilities } from "@/components/nuvio/scroll-utilities";
import { MobileStickyCta } from "@/components/nuvio/mobile-sticky-cta";
import { CookieConsent } from "@/components/nuvio/cookie-consent";
import {
  fetchTopMovies,
  fetchTopSeries,
  fetchMoviesByGenre,
} from "@/lib/nuvio";

// Fetch server-side with ISR. All data reads from the stable Stremio API
// (read-only client); never touches the Nuvio backend.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Parallel fetches for speed.
  const [movies, series, initialGenreMovies] = await Promise.all([
    fetchTopMovies(20),
    fetchTopSeries(18),
    fetchMoviesByGenre("Action", 18),
  ]);

  return (
    <>
      <ScrollUtilities />
      <Navbar />
      <main className="flex-1">
        <NuvioMovieSections
          movies={movies}
          series={series}
          initialGenreMovies={initialGenreMovies}
        />
        <Stats />
        <ChannelsGrid />
        <HowItWorks />
        <AppPreview movies={movies} />
        <Devices />
        <PriceComparison />
        <ComparisonTable />
        <PricingTiers />
        <Reviews />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <MobileStickyCta />
      <CookieConsent />
    </>
  );
}
