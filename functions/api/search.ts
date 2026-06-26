// Cloudflare Pages Function — self-contained, no imports from src/lib

const NUVIO_API = "https://nuviostreamapi.vercel.app/nuvio_2xa56et";

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
  const q = url.searchParams.get("q") ?? "";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(40, Math.max(1, parseInt(limitParam, 10) || 12)) : 12;

  if (q.trim().length < 2) {
    return new Response(JSON.stringify({ movies: [], query: q }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/movie/cinemeta___top/search=${encodeURIComponent(q.trim())}.json`,
      {
        headers: { "Accept": "application/json" },
        // @ts-ignore — cf is a Cloudflare extension to the standard fetch init
        cf: { cacheTtl: 600, cacheEverything: true },
      }
    );
    if (!res.ok) {
      return new Response(JSON.stringify({ movies: [], query: q }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const movies = metas.filter((m) => m.background && m.poster).map(mapMeta).slice(0, limit);
    return new Response(JSON.stringify({ movies, query: q }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch {
    return new Response(JSON.stringify({ movies: [], query: q }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
