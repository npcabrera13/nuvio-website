import { fetchMoviesByGenre, fetchTopMovies, MOVIE_GENRES } from "../../src/lib/nuvio";

export const onRequestGet = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const genre = url.searchParams.get("genre");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 18)) : 18;

  if (genre && !MOVIE_GENRES.includes(genre as any)) {
    return new Response(JSON.stringify({ error: "Invalid genre" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const movies = genre ? await fetchMoviesByGenre(genre, limit) : await fetchTopMovies(limit);
  return new Response(JSON.stringify({ movies }), { headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
};
