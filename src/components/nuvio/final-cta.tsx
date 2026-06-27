"use client";

import { Play, ShieldCheck, Zap, Headphones } from "lucide-react";

export function FinalCta() {
  return (
    <section id="trial" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-12 sm:px-12 sm:py-16 text-center">
          {/* gradient background */}
          <div className="absolute inset-0 -z-10 nuvio-gradient-bg opacity-90" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="absolute inset-0 -z-10 nuvio-grid-bg opacity-30" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Ready to start watching?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl mx-auto">
            Join 2,400+ users streaming everything for ₱49/month. Create your account and start your 7-day free trial — no credit card needed.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-bold text-violet-700 shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Create Account — 7 Days Free
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 active:scale-95 transition"
            >
              Log in
            </a>
          </div>

          {/* trust badges */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Secure via PayMongo
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> Setup in 2 min
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="h-4 w-4" /> 7-day-a-week support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
