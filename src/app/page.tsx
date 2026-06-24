import { Navbar } from "@/components/nuvio/navbar";
import { Hero } from "@/components/nuvio/hero";
import { MovieRow } from "@/components/nuvio/movie-row";
import { ChannelsGrid } from "@/components/nuvio/channels-grid";
import { AppPreview } from "@/components/nuvio/app-preview";
import { PriceComparison } from "@/components/nuvio/price-comparison";
import { PricingTiers } from "@/components/nuvio/pricing-tiers";
import { Reviews } from "@/components/nuvio/reviews";
import { Faq } from "@/components/nuvio/faq";
import { FinalCta } from "@/components/nuvio/final-cta";
import { Footer } from "@/components/nuvio/footer";
import { fetchTopMovies } from "@/lib/nuvio";

// Fetch movies server-side. `revalidate: 3600` is set in the data layer,
// so this runs at most once per hour and never blocks the client render.
export const dynamic = "force-dynamic";

export default async function Home() {
  const movies = await fetchTopMovies(20);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero movies={movies} />
        <MovieRow movies={movies} />
        <ChannelsGrid />
        <AppPreview movies={movies} />
        <PriceComparison />
        <PricingTiers />
        <Reviews />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
