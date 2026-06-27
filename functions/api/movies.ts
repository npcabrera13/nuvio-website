// Cloudflare Pages Function — self-contained, no imports from src/lib
// (src/lib/nuvio.ts uses Next.js fetch extensions that don't exist in Workers)

const NUVIO_API = "https://nuviostreamapi.vercel.app/nuvio_2xa56et";

const VALID_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama",
  "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller",
] as const;

interface CinemetaMeta {
  id: string;
  imdb_id?: string;
  name: string;
  year?: string | null;
  imdbRating?: string | null;
  genres?: string[];
  genre?: string[];
  description?: string | null;
  poster?: string;
  background?: string;
  logo?: string;
  runtime?: string | null;
  cast?: string[];
  trailerStreams?: { ytId?: string; source?: string }[];
  trailers?: { source?: string }[];
}

function mapMeta(m: CinemetaMeta) {
  const trailerYtIds: string[] = [];
  if (m.trailerStreams) {
    for (const t of m.trailerStreams) {
      const id = t.ytId ?? t.source;
      if (id && id.length === 11) trailerYtIds.push(id);
    }
  } else if (m.trailers) {
    for (const t of m.trailers) {
      if (t.source && t.source.length === 11) trailerYtIds.push(t.source);
    }
  }
  return {
    id: m.id ?? m.imdb_id ?? "",
    name: m.name ?? "Untitled",
    year: m.year ?? null,
    imdbRating: m.imdbRating && m.imdbRating !== "" ? m.imdbRating : null,
    genres: m.genres ?? m.genre ?? [],
    description: m.description ?? null,
    poster: m.poster ?? "",
    background: m.background ?? "",
    logo: m.logo ?? null,
    runtime: m.runtime ?? null,
    cast: m.cast ?? [],
    trailerYtIds,
  };
}

export const onRequestGet = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const genre = url.searchParams.get("genre");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 18)) : 18;

  if (genre && !VALID_GENRES.includes(genre as any)) {
    return new Response(JSON.stringify({ error: "Invalid genre" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const endpoint = genre
      ? `${NUVIO_API}/catalog/movie/cinemeta___top/genre=${encodeURIComponent(genre)}.json`
      : `${NUVIO_API}/catalog/movie/cinemeta___top.json`;
    const res = await fetch(endpoint, {
      headers: { "Accept": "application/json" },
      // cf cacheTtl is a Cloudflare-native fetch extension (works in Workers)
      // @ts-ignore — cf is a Cloudflare extension to the standard fetch init
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ movies: [] }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const movies = metas.filter((m) => m.background && m.poster).map(mapMeta).slice(0, limit);
    return new Response(JSON.stringify({ movies }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return new Response(JSON.stringify({ movies: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
