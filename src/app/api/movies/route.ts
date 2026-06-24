import { NextRequest, NextResponse } from "next/server";
import { fetchMoviesByGenre, fetchTopMovies, MOVIE_GENRES } from "@/lib/nuvio";

/**
 * GET /api/movies?genre=Action&limit=18
 *
 * Our own Next.js API route that reads from the stable Stremio Cinemeta
 * catalog. This does NOT touch the Nuvio backend (api/proxy.js, vercel.json,
 * .m3u files) — it only performs a read fetch to the public catalog JSON,
 * same as the server-side fetchTopMovies() already does.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 18)) : 18;

  if (genre && !MOVIE_GENRES.includes(genre as (typeof MOVIE_GENRES)[number])) {
    return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
  }

  const movies = genre
    ? await fetchMoviesByGenre(genre, limit)
    : await fetchTopMovies(limit);

  return NextResponse.json(
    { movies },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
