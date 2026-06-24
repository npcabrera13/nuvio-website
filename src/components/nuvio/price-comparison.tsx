import { COMPETITOR_BRANDS } from "@/lib/nuvio";
import { ArrowDown, Check } from "lucide-react";

function CompetitorLogo({ brand }: { brand: (typeof COMPETITOR_BRANDS)[number] }) {
  if (brand.slug) {
    return (
      <img
        src={`https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${brand.slug}.svg`}
        alt={`${brand.name} logo`}
        loading="lazy"
        className="nuvio-white-logo h-6 sm:h-7 w-auto transition-opacity"
      />
    );
  }
  if (brand.png) {
    return (
      <img
        src={brand.png}
        alt={`${brand.name} logo`}
        loading="lazy"
        className="nuvio-white-logo h-6 sm:h-7 w-auto transition-opacity"
      />
    );
  }
  return (
    <span className="text-base sm:text-lg font-bold text-white/70 transition-opacity hover:text-white">
      {brand.name}
    </span>
  );
}

export function PriceComparison() {
  // duplicate the brand list for a seamless marquee
  const marquee = [...COMPETITOR_BRANDS, ...COMPETITOR_BRANDS];

  return (
    <section className="relative py-14 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            The math is simple
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Why pay for ten apps?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Subscribing to every major service separately costs a fortune. Nuvio bundles them all for less than the price of one.
          </p>
        </div>

        {/* Competitor marquee */}
        <div className="relative mt-9 overflow-hidden mask-fade-x">
          <div className="flex w-max nuvio-marquee gap-10 sm:gap-14">
            {marquee.map((b, i) => (
              <div key={`${b.name}-${i}`} className="flex items-center justify-center shrink-0 h-10">
                <CompetitorLogo brand={b} />
              </div>
            ))}
          </div>
        </div>

        {/* Comparison visual */}
        <div className="mt-10 grid gap-5 md:grid-cols-[1fr_auto_1fr] items-center">
          {/* Competitor total */}
          <div className="nuvio-card rounded-3xl p-6 sm:p-8 text-center order-1">
            <p className="text-sm font-semibold text-muted-foreground">All these, separately</p>
            <p className="mt-2 text-4xl sm:text-5xl font-extrabold text-white/80 line-through decoration-red-500/70 decoration-2">
              ₱2,649
            </p>
            <p className="mt-1 text-sm text-muted-foreground">per month</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {["Netflix ₱549", "Disney+ ₱459", "HBO ₱599", "Prime ₱399", "+ 6 more"].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex md:flex-col items-center justify-center gap-2 order-2 py-2">
            <div className="nuvio-float flex h-12 w-12 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-lg shadow-violet-900/40">
              <ArrowDown className="h-6 w-6 md:rotate-0 rotate-90" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground md:hidden">switch to</span>
          </div>

          {/* Nuvio */}
          <div className="nuvio-card rounded-3xl p-6 sm:p-8 text-center order-3 relative overflow-hidden border-violet-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 to-pink-500/10" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2.5">
                <img
                  src="https://i.ibb.co/J91qPG0/Logo-1080x1080.png"
                  alt="Nuvio"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-md object-contain p-0.5 ring-1 ring-white/15 bg-background"
                />
                <span className="text-lg font-bold">Nuvio</span>
              </div>
              <p className="mt-3 text-5xl sm:text-6xl font-extrabold tracking-tight nuvio-gradient-text">
                ₱49
              </p>
              <p className="mt-1 text-sm text-muted-foreground">per month</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3.5 py-1.5 text-sm font-bold text-green-300 ring-1 ring-green-500/30">
                <Check className="h-4 w-4" />
                Save 98% — ₱2,600/month
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
