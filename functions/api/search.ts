import { searchMovies } from "../../src/lib/nuvio";

export const onRequestGet = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 12)) : 12;

  if (q.trim().length < 2) {
    return new Response(JSON.stringify({ movies: [], query: q }), { headers: { "Content-Type": "application/json" } });
  }

  const movies = await searchMovies(q, limit);
  return new Response(JSON.stringify({ movies, query: q }), { headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
};
