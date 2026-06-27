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
  "Anime",
  "Sports",
];

/** Fallback colored tile shown if a channel logo fails to load. */
const FALLBACK_COLORS = [
  "#7c3aed", "#ec4899", "#3b82f6", "#10b981",
  "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
];

function ChannelTile({ channel, index }: { channel: (typeof CHANNELS)[number]; index: number }) {
  const [errored, setErrored] = useState(false);
  const fallbackColor = FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  return (
    <div
      className="group relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-white/20 hover:-translate-y-1 flex items-center justify-center p-3"
    >
      {errored ? (
        // Styled text fallback when logo fails to load
        <div
          className="flex h-full w-full flex-col items-center justify-center rounded-xl text-center"
          style={{ backgroundColor: fallbackColor }}
        >
          <span className="text-sm font-extrabold text-white line-clamp-2 px-1">
            {channel.name}
          </span>
        </div>
      ) : (
        <img
          src={channel.logo}
          alt={channel.name}
          loading="lazy"
          onError={() => setErrored(true)}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      )}
      {/* hover check */}
      <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <Check className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

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
            All Channels. One Price.
          </h2>
          <p className="mt-3 text-muted-foreground">
            From free-to-air favorites to global news, kids, anime, and sports — every channel is included from day one.
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
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {visible.map((c, i) => (
            <ChannelTile key={c.name} channel={c} index={i} />
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
