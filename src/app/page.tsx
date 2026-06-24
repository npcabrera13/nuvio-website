import { Navbar } from "@/components/nuvio/navbar";
import { NuvioMovieSections } from "@/components/nuvio/nuvio-movie-sections";
import { Stats } from "@/components/nuvio/stats";
import { ChannelsGrid } from "@/components/nuvio/channels-grid";
import { HowItWorks } from "@/components/nuvio/how-it-works";
import { AppPreview } from "@/components/nuvio/app-preview";
import { Devices } from "@/components/nuvio/devices";
import { PriceComparison } from "@/components/nuvio/price-comparison";
import { PricingTiers } from "@/components/nuvio/pricing-tiers";
import { Reviews } from "@/components/nuvio/reviews";
import { Faq } from "@/components/nuvio/faq";
import { FinalCta } from "@/components/nuvio/final-cta";
import { Footer } from "@/components/nuvio/footer";
import { ScrollUtilities } from "@/components/nuvio/scroll-utilities";
import { MobileStickyCta } from "@/components/nuvio/mobile-sticky-cta";
import { CookieConsent } from "@/components/nuvio/cookie-consent";
import { fetchTopMovies } from "@/lib/nuvio";

// Fetch movies server-side. `revalidate: 3600` is set in the data layer,
// so this runs at most once per hour and never blocks the client render.
export const dynamic = "force-dynamic";

export default async function Home() {
  const movies = await fetchTopMovies(20);

  return (
    <>
      <ScrollUtilities />
      <Navbar />
      <main className="flex-1">
        <NuvioMovieSections movies={movies} />
        <Stats />
        <ChannelsGrid />
        <HowItWorks />
        <AppPreview movies={movies} />
        <Devices />
        <PriceComparison />
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
