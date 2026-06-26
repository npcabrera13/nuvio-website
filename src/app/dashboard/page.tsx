"use client";

import { useEffect, useState } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { NuvioMovie } from "@/lib/nuvio";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [movies, setMovies] = useState<NuvioMovie[]>([]);
  const [series, setSeries] = useState<NuvioMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("https://nuviostreamapi.vercel.app/nuvio_2xa56et/catalog/movie/cinemeta___top.json")
        .then(r => r.json())
        .then(d => (d.metas || []).filter((m: any) => m.background && m.poster).slice(0, 13)),
      fetch("https://nuviostreamapi.vercel.app/nuvio_2xa56et/catalog/series/cinemeta___top.json")
        .then(r => r.json())
        .then(d => (d.metas || []).filter((m: any) => m.background && m.poster).slice(0, 12)),
    ]).then(([m, s]) => {
      setMovies(m);
      setSeries(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return <DashboardClient movies={movies} series={series} />;
}
