"use client";

import { useMemo, useState } from "react";
import { Calculator, TrendingDown, ArrowRight, Check, Share2 } from "lucide-react";
import { COMPETITOR_BRANDS, type BrandLogo } from "@/lib/nuvio";

interface Subscription {
  name: string;
  monthly: number;
  brand: BrandLogo;
}

// Match brands to the COMPETITOR_BRANDS data for real logos
const SUBSCRIPTIONS: Subscription[] = [
  { name: "Netflix", monthly: 549, brand: COMPETITOR_BRANDS.find((b) => b.name === "Netflix")! },
  { name: "Disney+", monthly: 459, brand: COMPETITOR_BRANDS.find((b) => b.name === "Disney+")! },
  { name: "HBO Max", monthly: 599, brand: COMPETITOR_BRANDS.find((b) => b.name === "HBO Max")! },
  { name: "Prime Video", monthly: 399, brand: COMPETITOR_BRANDS.find((b) => b.name === "Prime Video")! },
  { name: "Apple TV+", monthly: 449, brand: COMPETITOR_BRANDS.find((b) => b.name === "Apple TV+")! },
  { name: "Crunchyroll", monthly: 295, brand: COMPETITOR_BRANDS.find((b) => b.name === "Crunchyroll")! },
  { name: "Cignal TV", monthly: 650, brand: COMPETITOR_BRANDS.find((b) => b.name === "Cignal TV")! },
  { name: "Sky Cable", monthly: 550, brand: COMPETITOR_BRANDS.find((b) => b.name === "Sky Cable")! },
];

function BrandIcon({ brand }: { brand: BrandLogo }) {
  if (brand.slug) {
    return (
      <img
        src={`https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${brand.slug}.svg`}
        alt={`${brand.name} logo`}
        loading="lazy"
        className="nuvio-white-logo h-5 w-5"
      />
    );
  }
  if (brand.png) {
    return (
      <img
        src={brand.png}
        alt={`${brand.name} logo`}
        loading="lazy"
        className="nuvio-white-logo h-5 w-5"
      />
    );
  }
  // Text fallback for Cignal TV, Sky Cable
  return (
    <span className="text-[10px] font-bold text-foreground/70">
      {brand.name.slice(0, 4)}
    </span>
  );
}

const NUVIO_MONTHLY = 49;

export function SavingsCalculator() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["Netflix", "Disney+", "HBO Max"])
  );

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const { currentMonthly, currentYearly, nuvioYearly, yearlySavings, percent } =
    useMemo(() => {
      const currentMonthly = SUBSCRIPTIONS.filter((s) =>
        selected.has(s.name)
      ).reduce((sum, s) => sum + s.monthly, 0);
      const currentYearly = currentMonthly * 12;
      const nuvioYearly = NUVIO_MONTHLY * 12;
      const yearlySavings = Math.max(0, currentYearly - nuvioYearly);
      const percent =
        currentYearly > 0
          ? Math.round((yearlySavings / currentYearly) * 100)
          : 0;
      return { currentMonthly, currentYearly, nuvioYearly, yearlySavings, percent };
    }, [selected]);

  return (
    <section id="calculator" className="relative py-14 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-400 flex items-center justify-center gap-1.5">
            <Calculator className="h-4 w-4" /> See your savings
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            How much could you save?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Toggle the subscriptions you currently pay for. We&apos;ll show your yearly savings switching to Nuvio.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          {/* Subscription toggles */}
          <div className="nuvio-card rounded-3xl p-5 sm:p-6">
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              Your current subscriptions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SUBSCRIPTIONS.map((s) => {
                const active = selected.has(s.name);
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => toggle(s.name)}
                    aria-pressed={active}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                      active
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                      <BrandIcon brand={s.brand} />
                    </span>
                    <span className="text-[11px] font-medium text-center leading-tight">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ₱{s.monthly}/mo
                    </span>
                    {active && (
                      <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Tap to add or remove. Most Filipinos subscribe to 3–5 of these.
            </p>
          </div>

          {/* Results panel */}
          <div className="nuvio-card rounded-3xl p-6 flex flex-col relative overflow-hidden border-violet-500/20">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/10 to-pink-500/5" />

            {/* Current total */}
            <div>
              <p className="text-sm text-muted-foreground">You currently pay</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums">
                  ₱{currentMonthly.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ₱{currentYearly.toLocaleString()}/year
              </p>
            </div>

            {/* Arrow */}
            <div className="my-4 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>

            {/* With Nuvio */}
            <div>
              <p className="text-sm text-muted-foreground">With Nuvio</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums nuvio-gradient-text">
                  ₱{NUVIO_MONTHLY}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ₱{nuvioYearly.toLocaleString()}/year
              </p>
            </div>

            {/* Savings badge */}
            <div className="mt-auto pt-5">
              <div className="relative rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center">
                {yearlySavings > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const text = `I'm saving ₱${yearlySavings.toLocaleString()}/year with Nuvio — all my streaming in one app for ₱49/month! 💜`;
                      if (navigator.share) {
                        navigator.share({ title: "Nuvio savings", text, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(`${text} ${window.location.href}`).catch(() => {});
                      }
                    }}
                    aria-label="Share your savings"
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-green-300 hover:bg-white/20 active:scale-95 transition"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-green-300">
                  You save every year
                </p>
                <p className="mt-1 text-4xl font-extrabold text-green-300 tabular-nums">
                  ₱{yearlySavings.toLocaleString()}
                </p>
                {percent > 0 && (
                  <p className="mt-1 text-sm font-medium text-green-400/80">
                    {percent}% less than what you pay now
                  </p>
                )}
              </div>
              <a
                href="#trial"
                className="mt-3 nuvio-gradient-bg nuvio-glow inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
              >
                Start saving today
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
