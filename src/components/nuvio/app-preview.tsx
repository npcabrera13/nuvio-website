"use client";

import { useState } from "react";
import { Film, Layers, Radio, Star, Play, Search } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";

interface AppPreviewProps {
  movies: NuvioMovie[];
}

function BrowserChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="ml-2 flex-1 truncate rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
        {title}
      </div>
    </div>
  );
}

export function AppPreview({ movies }: AppPreviewProps) {
  const [tab, setTab] = useState(0);
  const browseMovies = movies.slice(0, 6);
  const liveChannels = [
    { name: "GMA Network", short: "GMA", live: "24 Oras" },
    { name: "A2Z Channel 11", short: "A2Z", live: "TV Patrol" },
    { name: "Al Jazeera", short: "AJE", live: "Newsroom" },
    { name: "Disney XD", short: "DXD", live: "Marvel" },
    { name: "HBO", short: "HBO", live: "Dune" },
    { name: "Cartoon Network", short: "CN", live: "Toonami" },
  ];

  const tabs = [
    { id: 0, label: "Browse Movies", icon: Film },
    { id: 1, label: "Pick Your Stream", icon: Layers },
    { id: 2, label: "Live TV", icon: Radio },
  ];

  return (
    <section id="features" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            Inside the app
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Beautifully simple. Surprisingly powerful.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to find and play your next favorite — in three taps or less.
          </p>
        </div>

        {/* Mobile tab switcher */}
        <div className="mt-7 flex sm:hidden justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                tab === t.id
                  ? "nuvio-gradient-bg text-white"
                  : "border border-white/10 bg-white/5 text-muted-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* 1. Browse Movies */}
          <div
            className={`nuvio-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40 transition-all ${
              tab === 0 ? "block" : "hidden sm:block"
            }`}
          >
            <BrowserChrome title="nuvio.app · Popular Movies" />
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  Search 10,000+ titles…
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {browseMovies.map((m) => (
                  <div key={m.id} className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10">
                    <img src={m.poster} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
                      <p className="text-[8px] sm:text-[9px] font-semibold text-white line-clamp-1">{m.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Film className="h-3 w-3" /> Cinemeta Top</span>
                <span className="nuvio-gradient-text font-bold">10,000+ titles</span>
              </div>
            </div>
          </div>

          {/* 2. Pick Your Stream */}
          <div
            className={`nuvio-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40 transition-all ${
              tab === 1 ? "block" : "hidden sm:block"
            }`}
          >
            <BrowserChrome title="nuvio.app · Select Stream" />
            <div className="p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md nuvio-gradient-bg px-2 py-1 text-[10px] font-bold text-white">
                  Nuvio Bundle · 1080p
                </span>
                <span className="text-[11px] text-muted-foreground">3 streams found</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Dune.Part.Two.2024.1080p.BluRay.mkv", seed: 2081, size: "1.86 GB", src: "1337x", best: true },
                  { name: "Dune.Part.Two.2024.1080p.WEB-DL.mkv", seed: 1543, size: "2.04 GB", src: "Torrentio" },
                  { name: "Dune.Part.Two.2024.720p.HDRip.mkv", seed: 921, size: "1.12 GB", src: "RARBG" },
                ].map((s) => (
                  <div
                    key={s.src}
                    className={`rounded-xl border p-2.5 transition-colors ${
                      s.best ? "border-violet-500/40 bg-violet-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg nuvio-gradient-bg text-white">
                        <Play className="h-3 w-3 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-medium text-foreground line-clamp-1 break-all">
                          {s.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] sm:text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">👤 {s.seed}</span>
                          <span className="flex items-center gap-1">💾 {s.size}</span>
                          <span className="flex items-center gap-1">⚙️ {s.src}</span>
                        </div>
                      </div>
                      {s.best && (
                        <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-bold text-violet-300">
                          BEST
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Auto-picks the best stream — no manual hunting.
              </div>
            </div>
          </div>

          {/* 3. Live TV */}
          <div
            className={`nuvio-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40 transition-all ${
              tab === 2 ? "block" : "hidden sm:block"
            }`}
          >
            <BrowserChrome title="nuvio.app · Live TV" />
            <div className="p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <Radio className="h-3.5 w-3.5 text-pink-400" /> 27 Live Channels
                </span>
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> ON AIR
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {liveChannels.map((c) => (
                  <div key={c.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center">
                    <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-pink-500/20 text-[10px] font-extrabold ring-1 ring-white/10">
                      {c.short}
                    </div>
                    <p className="mt-1 text-[8px] sm:text-[9px] font-semibold text-foreground/80 line-clamp-1">{c.name}</p>
                    <p className="text-[7px] sm:text-[8px] text-pink-300">{c.live}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>HD quality</span>
                <span className="nuvio-gradient-text font-bold">No ads, no buffer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
