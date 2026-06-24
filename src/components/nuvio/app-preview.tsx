"use client";

import { useState } from "react";
import { Film, Layers, Radio, Star, Play, Search, Home, User } from "lucide-react";
import type { NuvioMovie } from "@/lib/nuvio";

interface AppPreviewProps {
  movies: NuvioMovie[];
}

function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[260px] rounded-[2rem] border-[6px] border-[#1a1a24] bg-[#0a0a0f] overflow-hidden shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 h-5 w-24 rounded-b-2xl bg-[#1a1a24]" />
        {/* Screen content */}
        <div className="relative aspect-[9/18] overflow-hidden">
          {children}
        </div>
      </div>
      <p className="mt-3 text-xs sm:text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const icons = [
    { Icon: Home, label: "Home", key: "home" },
    { Icon: Search, label: "Search", key: "search" },
    { Icon: Film, label: "Movies", key: "movies" },
    { Icon: Radio, label: "Live", key: "live" },
    { Icon: User, label: "Me", key: "me" },
  ];
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-around border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-sm py-2">
      {icons.map(({ Icon, label, key }) => (
        <div
          key={key}
          className={`flex flex-col items-center gap-0.5 ${active === key ? "text-violet-400" : "text-white/40"}`}
        >
          <Icon className="h-4 w-4" />
          <span className="text-[8px] font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function AppPreview({ movies }: AppPreviewProps) {
  const [tab, setTab] = useState(0);
  const browseMovies = movies.slice(0, 6);
  const liveChannels = [
    { name: "GMA", color: "#e2241a", live: "24 Oras" },
    { name: "CNN", color: "#cc0000", live: "Newsroom" },
    { name: "HBO", color: "#000000", live: "Dune" },
    { name: "BBC", color: "#bb1919", live: "World" },
    { name: "ESPN", color: "#d50032", live: "NBA" },
    { name: "Cartoon", color: "#000000", live: "Toon" },
  ];

  const tabs = [
    { id: 0, label: "Browse", icon: Film },
    { id: 1, label: "Streams", icon: Layers },
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
            A clean, modern interface that works the same on your phone, TV, and laptop.
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

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* 1. Browse Movies */}
          <div className={tab === 0 ? "block" : "hidden sm:block"}>
            <PhoneFrame label="Browse movies & series">
              <div className="h-full overflow-hidden bg-[#0a0a0f]">
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 pt-8 pb-2">
                  <span className="text-xs font-bold text-white">Popular</span>
                  <Search className="h-3.5 w-3.5 text-white/40" />
                </div>
                {/* Hero banner */}
                <div className="mx-3 mb-2 rounded-lg overflow-hidden h-16 relative">
                  {browseMovies[0] && (
                    <img src={browseMovies[0].background} alt="" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-1 left-2">
                    <p className="text-[8px] font-bold text-white">{browseMovies[0]?.name}</p>
                  </div>
                </div>
                {/* Grid */}
                <div className="px-3 grid grid-cols-3 gap-1.5 pb-16">
                  {browseMovies.slice(1, 7).map((m) => (
                    <div key={m.id} className="aspect-[2/3] rounded-md overflow-hidden border border-white/5">
                      <img src={m.poster} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                <BottomNav active="home" />
              </div>
            </PhoneFrame>
          </div>

          {/* 2. Pick Your Stream */}
          <div className={tab === 1 ? "block" : "hidden sm:block"}>
            <PhoneFrame label="Pick your stream">
              <div className="h-full overflow-hidden bg-[#0a0a0f]">
                {/* Top bar */}
                <div className="px-4 pt-8 pb-2">
                  <span className="text-xs font-bold text-white">Select stream</span>
                  <p className="text-[8px] text-white/40">3 sources found</p>
                </div>
                {/* Stream list */}
                <div className="px-3 space-y-2 pb-16">
                  {[
                    { name: "1080p.BluRay.mkv", seed: 2081, size: "1.86 GB", src: "Nuvio", best: true },
                    { name: "1080p.WEB-DL.mkv", seed: 1543, size: "2.04 GB", src: "Source 2" },
                    { name: "720p.HDRip.mkv", seed: 921, size: "1.12 GB", src: "Source 3" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-2 ${s.best ? "border-violet-500/40 bg-violet-500/10" : "border-white/10 bg-white/[0.02]"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.best ? "nuvio-gradient-bg" : "bg-white/10"}`}>
                          <Play className="h-3 w-3 fill-white text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-medium text-white truncate">{s.name}</p>
                          <div className="flex gap-2 text-[7px] text-white/50 mt-0.5">
                            <span>👤 {s.seed}</span>
                            <span>💾 {s.size}</span>
                            <span>⚙️ {s.src}</span>
                          </div>
                        </div>
                        {s.best && (
                          <span className="shrink-0 rounded bg-violet-500/20 px-1 py-0.5 text-[7px] font-bold text-violet-300">BEST</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <BottomNav active="movies" />
              </div>
            </PhoneFrame>
          </div>

          {/* 3. Live TV */}
          <div className={tab === 2 ? "block" : "hidden sm:block"}>
            <PhoneFrame label="Watch live TV">
              <div className="h-full overflow-hidden bg-[#0a0a0f]">
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 pt-8 pb-2">
                  <span className="text-xs font-bold text-white">Live TV</span>
                  <span className="flex items-center gap-1 text-[8px] text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> ON AIR
                  </span>
                </div>
                {/* Channel grid */}
                <div className="px-3 grid grid-cols-3 gap-1.5 pb-16">
                  {liveChannels.map((c) => (
                    <div key={c.name} className="rounded-md border border-white/10 overflow-hidden">
                      <div className="flex h-8 items-center justify-center" style={{ backgroundColor: c.color }}>
                        <span className="text-[8px] font-bold text-white">{c.name}</span>
                      </div>
                      <div className="bg-white/[0.03] p-1">
                        <p className="text-[6px] text-pink-300 truncate">{c.live}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <BottomNav active="live" />
              </div>
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
