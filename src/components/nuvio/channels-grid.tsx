"use client";

import { useState } from "react";
import { CHANNELS, type ChannelCategory } from "@/lib/nuvio";
import { Tv, Check } from "lucide-react";

const FILTERS: ("All" | ChannelCategory)[] = [
  "All",
  "Philippine",
  "News",
  "Kids",
  "Movies",
  "Entertainment",
  "Sports",
  "Discovery",
];

export function ChannelsGrid() {
  const [filter, setFilter] = useState<"All" | ChannelCategory>("All");

  const visible =
    filter === "All" ? CHANNELS : CHANNELS.filter((c) => c.category === filter);

  return (
    <section id="channels" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            Live TV included
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            All {CHANNELS.length} Channels. One Price.
          </h2>
          <p className="mt-3 text-muted-foreground">
            From Philippine free-to-air favorites to global news, kids, movies and sports — every channel is included from day one.
          </p>
        </div>

        {/* Filter pills */}
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? "nuvio-gradient-bg text-white shadow-lg shadow-violet-900/30"
                  : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              {f}
              {f === "All" && (
                <span className="ml-1.5 text-xs opacity-70">({CHANNELS.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {visible.map((c) => (
            <div
              key={c.name}
              className="group relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl border border-white/10 transition-all hover:border-white/20 hover:-translate-y-1"
              style={{ backgroundColor: c.color }}
            >
              {/* Sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-3 text-center">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 text-base sm:text-lg font-extrabold tracking-tight text-white backdrop-blur-sm">
                  {c.short}
                </div>
                <p className="mt-2 text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 text-white/90">
                  {c.name}
                </p>
              </div>

              {/* hover check */}
              <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Check className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Tv className="h-4 w-4 text-violet-400" />
          All channels stream in HD. No extra fees, no add-ons.
        </div>
      </div>
    </section>
  );
}
