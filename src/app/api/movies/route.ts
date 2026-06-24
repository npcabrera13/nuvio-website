import { NextRequest, NextResponse } from "next/server";
import { fetchMoviesByGenre, fetchTopMovies } from "@/lib/nuvio";

/**
 * GET /api/movies?genre=Action&limit=18
 *
 * Our own Next.js API route that reads from the stable Stremio Cinemeta
 * catalog. This does NOT touch the Nuvio backend (api/proxy.js, vercel.json,
 * .m3u files) — it only performs a read fetch to the public catalog JSON,
 * same as the server-side fetchTopMovies() already does.
 *
 * Note: any genre string is accepted — the Cinemeta catalog supports many
 * genres beyond the curated MOVIE_GENRES list (e.g. Biography, History,
 * Sport, Western, Documentary). Validation happens implicitly: if the
 * genre doesn't exist, the API returns an empty metas array.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 18)) : 18;

  // Basic sanitization: genre must be a short alphabetic string (no special chars)
  if (genre && !/^[A-Za-z][A-Za-z&-]{0,30}$/.test(genre)) {
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
