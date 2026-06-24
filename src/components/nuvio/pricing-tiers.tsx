import { PRICING_TIERS } from "@/lib/nuvio";
import { Check, Crown, Sparkles } from "lucide-react";

export function PricingTiers() {
  return (
    <section id="pricing" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            Simple, honest pricing
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Pick your plan. Cancel anytime.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No lock-in contracts. No hidden fees. Pay once and stream everything.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3 items-stretch">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-3xl p-6 sm:p-7 transition-all ${
                tier.highlight
                  ? "nuvio-card border-violet-500/40 lg:scale-[1.04] lg:-mt-2 lg:mb-2 shadow-2xl shadow-violet-900/30"
                  : "nuvio-card hover:-translate-y-1"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full nuvio-gradient-bg px-3 py-1 text-xs font-bold text-white shadow-lg shadow-violet-900/40">
                    <Crown className="h-3.5 w-3.5" />
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{tier.duration}</h3>
                {tier.highlight ? (
                  <Sparkles className="h-5 w-5 text-pink-400" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </div>

              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-5xl font-extrabold tracking-tight">₱{tier.price}</span>
                <span className="mb-1.5 text-sm text-muted-foreground">one-time</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-green-400">{tier.perDay}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#trial"
                className={`mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-semibold transition-all active:scale-95 ${
                  tier.highlight
                    ? "nuvio-gradient-bg nuvio-glow text-white hover:scale-[1.02]"
                    : "border border-white/15 bg-white/5 text-foreground hover:bg-white/10"
                }`}
              >
                {tier.highlight ? "Start 7 Days Free" : `Get ${tier.duration}`}
              </a>
            </div>
          ))}
        </div>

        {/* Payment footnote */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <span className="text-base">💳</span>
            Pay via GCash, Maya, or credit card
          </p>
          <span className="hidden sm:inline text-white/20">·</span>
          <p className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            Secure payment via PayMongo
          </p>
        </div>
      </div>
    </section>
  );
}
