import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
import { searchMovies } from "@/lib/nuvio";

/**
 * GET /api/search?q=batman&limit=12
 *
 * Search the Stremio Cinemeta catalog by title.
 * Read-only fetch — does NOT touch the Nuvio backend.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 12))
    : 12;

  if (q.trim().length < 2) {
    return NextResponse.json({ movies: [], query: q });
  }

  const movies = await searchMovies(q, limit);

  return NextResponse.json(
    { movies, query: q },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    }
  );
}
