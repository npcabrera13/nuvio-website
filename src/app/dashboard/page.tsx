import { fetchTopMovies, fetchTopSeries } from "@/lib/nuvio";
export const runtime = "edge";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch real trending content server-side
  const [movies, series] = await Promise.all([
    fetchTopMovies(13),
    fetchTopSeries(12),
  ]);

  return <DashboardClient movies={movies} series={series} />;
}
