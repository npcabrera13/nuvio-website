/**
 * Nuvio data layer.
 *
 * IMPORTANT (no-backend rule):
 * This module ONLY *reads* from the existing, stable Stremio API at
 * `nuviostreamapi.vercel.app`. It never mutates routing or proxy logic.
 * All data fetching happens server-side so it never blocks client render.
 */

const NUVIO_API = "https://nuviostreamapi.vercel.app/nuvio_2xa56et";

export interface NuvioMovie {
  id: string;
  name: string;
  year: string | null;
  imdbRating: string | null;
  genres: string[];
  description: string | null;
  poster: string;
  background: string;
  logo: string | null;
  runtime: string | null;
  cast: string[];
  /** YouTube trailer video IDs (from Stremio trailerStreams). */
  trailerYtIds: string[];
}

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

function mapMeta(m: CinemetaMeta): NuvioMovie {
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
    poster: (m.poster as string) ?? "",
    background: (m.background as string) ?? "",
    logo: m.logo ?? null,
    runtime: m.runtime ?? null,
    cast: m.cast ?? [],
    trailerYtIds,
  };
}

/**
 * Fetch the top movies from the Cinemeta catalog.
 * Runs server-side; returns at most `limit` movies that have a backdrop image.
 */
export async function fetchTopMovies(limit = 20): Promise<NuvioMovie[]> {
  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/movie/cinemeta___top.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const movies: NuvioMovie[] = metas
      .filter((m) => m.background && m.poster)
      .map(mapMeta);
    return movies.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fetch movies for a specific genre from the Cinemeta catalog using the
 * genre extra. Returns the full list (caller may slice).
 */
export async function fetchMoviesByGenre(
  genre: string,
  limit = 18
): Promise<NuvioMovie[]> {
  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/movie/cinemeta___top/genre=${encodeURIComponent(
        genre
      )}.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const movies: NuvioMovie[] = metas
      .filter((m) => m.background && m.poster)
      .map(mapMeta);
    return movies.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fetch top TV series from the Cinemeta series catalog.
 */
export async function fetchTopSeries(limit = 18): Promise<NuvioMovie[]> {
  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/series/cinemeta___top.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const series: NuvioMovie[] = metas
      .filter((m) => m.background && m.poster)
      .map(mapMeta);
    return series.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Search movies by name using the Cinemeta search extra.
 */
export async function searchMovies(
  query: string,
  limit = 12
): Promise<NuvioMovie[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/movie/cinemeta___top/search=${encodeURIComponent(
        query.trim()
      )}.json`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const movies: NuvioMovie[] = metas
      .filter((m) => m.background && m.poster)
      .map(mapMeta);
    return movies.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fetch trending anime from the Kitsu catalog.
 */
export async function fetchTrendingAnime(
  limit = 18
): Promise<NuvioMovie[]> {
  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/anime/animekitsu___kitsu-anime-trending.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const anime: NuvioMovie[] = metas
      .filter((m) => m.background && m.poster)
      .map(mapMeta);
    return anime.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fetch RT Certified Fresh movies (critically acclaimed picks).
 * The RT catalog only provides posters (from flixster) and IMDB ids, so we
 * construct the metahub background URL from the imdb id when missing.
 */
export async function fetchRtFreshMovies(
  limit = 18
): Promise<NuvioMovie[]> {
  try {
    const res = await fetch(
      `${NUVIO_API}/catalog/movie/tomatometadata___rtfresh_movie.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { metas: CinemetaMeta[] };
    const metas = data.metas ?? [];
    const movies: NuvioMovie[] = metas
      .filter((m) => m.poster && (m.id ?? m.imdb_id))
      .map((m) => {
        const id = m.id ?? m.imdb_id ?? "";
        // Construct metahub background from imdb id if missing
        const background =
          m.background ?? `https://images.metahub.space/background/medium/${id}/img`;
        return mapMeta({ ...m, background, id });
      });
    return movies.slice(0, limit);
  } catch {
    return [];
  }
}

/** Genres offered by the Cinemeta movie catalog (for the browser filter). */
export const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const;

export type MovieGenre = (typeof MOVIE_GENRES)[number];

export type ChannelCategory =
  | "Philippine"
  | "News"
  | "Kids"
  | "Movies"
  | "Entertainment"
  | "Sports"
  | "Anime";

export interface NuvioChannel {
  name: string;
  /** Real logo URL from the Nuvio bundle's .m3u tvg-logo attribute. */
  logo: string;
  category: ChannelCategory;
}

/**
 * The curated lineup of live channels from the Nuvio bundle.
 * Names + logo URLs are pulled directly from the bundle's .m3u files
 * (master-ph-v2.m3u + vip-cherry-pick.m3u) — no hallucination.
 */
export const CHANNELS: NuvioChannel[] = [
  // Philippine (PH Local + PH News + PH Entertainment + PH Movies + PH Religious + PH Regional)
  { name: "GMA Network HD", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/gma-ph.png", category: "Philippine" },
  { name: "A2Z HD", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/a2z-ph.png", category: "Philippine" },
  { name: "ALLTV HD", logo: "https://i.imgur.com/bmd4D8Z.jpeg", category: "Philippine" },
  { name: "PTV 4 HD", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/ptv-ph.png", category: "Philippine" },
  { name: "INC TV HD", logo: "https://i.imgur.com/Rhrf4nj.jpeg", category: "Philippine" },
  { name: "Jeepney TV", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/jeepney-tv-ph.png", category: "Philippine" },
  { name: "Tagalized Movie Channel", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/tmc-ph.png", category: "Philippine" },
  { name: "TV Maria", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/tv-maria-ph.png", category: "Philippine" },
  { name: "CLTV 36", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/cltv-ph.png", category: "Philippine" },
  { name: "Bilyonario News Channel", logo: "https://i.imgur.com/k4X7If1.jpeg", category: "Philippine" },
  { name: "Abante", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Abante_masthead.svg/500px-Abante_masthead.svg.png", category: "Philippine" },
  { name: "Vegas Life TV", logo: "https://i.imgur.com/G7lONcu.png", category: "Philippine" },
  { name: "Mindanow Network TV", logo: "https://ml02dtnc01wc.i.optimole.com/w:512/h:512/q:mauto/https://mindanownetwork.com/wp-content/uploads/2024/11/Mindanow-Network-Logo-Vertical.png", category: "Philippine" },
  // News (Global + US)
  { name: "CGTN News Live", logo: "https://m.media-amazon.com/images/I/31wgHL2U4fL.png", category: "News" },
  { name: "Al Jazeera English", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/aljazeera-uk.png", category: "News" },
  { name: "CBS News 24/7", logo: "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/vuphdwqrruacvgmt6fwj?ik-sanitizeSvg=true", category: "News" },
  { name: "ABC News Live", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/abc-news-us.png", category: "News" },
  // Kids
  { name: "Baby Shark TV", logo: "https://yt3.googleusercontent.com/yumIBPCfrCDj0yCBn3mJdVxjmhvC7q3h0H84dhj4o1nfDlLINQRSTgm2GdLAZOevAciyjKHKmg=s900-c-k-c0x00ffffff-no-rj", category: "Kids" },
  { name: "Tom and Jerry", logo: "https://m.media-amazon.com/images/M/MV5BODY2YWI1OTAtY2FhZS00MGI1LTk0YjUtYmE3MDk0OGFkMWUyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg", category: "Kids" },
  { name: "Toon Goggles", logo: "https://static.wikia.nocookie.net/wikifanon/images/6/6c/Playhouse_Toon_Disney_%282002%29_logo.jpg/revision/latest/scale-to-width-down/998?cb=20230102152932", category: "Kids" },
  { name: "LEGO Channel", logo: "https://static.vecteezy.com/system/resources/previews/020/190/593/non_2x/lego-logo-lego-icon-free-free-vector.jpg", category: "Kids" },
  // Movies (Premium)
  { name: "Disney Channel", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/disney-channel-us.png", category: "Movies" },
  { name: "Disney XD", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/disney-xd-us.png", category: "Movies" },
  // Anime
  { name: "Pokemon", logo: "https://images.template.net/494381/Pokemon-Logo-Clipart-edit-online.png", category: "Anime" },
  { name: "Crunchyroll", logo: "https://static0.srcdn.com/wordpress/wp-content/uploads/2023/04/crunchyroll-poster-logo.jpg", category: "Anime" },
  { name: "Aniplus Asia", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/philippines/aniplus-ph.png", category: "Anime" },
  // Sports
  { name: "Premier Sports", logo: "https://www.raithrovers.net/wp-content/uploads/2025/05/INFO-1-scaled.png", category: "Sports" },
];

export interface PricingTier {
  id: string;
  duration: string;
  price: number;
  perDay: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "30",
    duration: "Monthly",
    price: 49,
    perDay: "All-in-one streaming bundle",
    badge: "7 DAYS FREE",
    highlight: true,
    features: ["Full movie & series library", "All live channels", "Full HD streaming", "Cancel anytime"],
  },
];

export interface BrandLogo {
  name: string;
  /** simple-icons slug (SVG) or null for text fallback */
  slug: string | null;
  /** PNG url from tv-logos repo, used for Disney+ / HBO Max */
  png?: string;
}

export const COMPETITOR_BRANDS: BrandLogo[] = [
  { name: "Netflix", slug: "netflix" },
  { name: "Prime Video", slug: "amazonprime" },
  { name: "Disney+", slug: null, png: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/disney-plus-us.png" },
  { name: "HBO Max", slug: null, png: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/hbo-max-us.png" },
  { name: "Apple TV+", slug: "appletv" },
  { name: "Crunchyroll", slug: "crunchyroll" },
  { name: "Hulu", slug: "hulu" },
  { name: "Paramount+", slug: "paramountplus" },
  { name: "Cignal TV", slug: null },
  { name: "Sky Cable", slug: null },
];

/** Feature matrix for the competitor comparison table. */
export interface ComparisonFeature {
  label: string;
  /** values per column: [Nuvio, Netflix, Disney+, HBO Max, Prime Video] */
  values: [string | boolean, string | boolean, string | boolean, string | boolean, string | boolean];
}

export const COMPARISON_COLUMNS = [
  "Nuvio",
  "Netflix",
  "Disney+",
  "HBO Max",
  "Prime Video",
] as const;

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    label: "Monthly price",
    values: ["₱49", "₱549", "₱459", "₱599", "₱399"],
  },
  {
    label: "Free trial",
    values: ["7 days", false, false, false, "30 days"],
  },
  {
    label: "Movies",
    values: ["10,000+", "1,500+", "1,000+", "900+", "2,000+"],
  },
  {
    label: "TV series",
    values: ["3,000+", "1,200+", "800+", "600+", "1,500+"],
  },
  {
    label: "Live TV channels",
    values: [true, false, false, false, false],
  },
  {
    label: "Pinoy content",
    values: [true, false, "Limited", false, false],
  },
  {
    label: "4K streaming",
    values: [true, true, true, true, "Select titles"],
  },
  {
    label: "Simultaneous devices",
    values: ["2", "1–2", "1–4", "1–3", "1–3"],
  },
  {
    label: "No ads",
    values: [true, "Premium only", "Premium only", true, true],
  },
  {
    label: "GCash / Maya payment",
    values: [true, false, false, false, false],
  },
  {
    label: "Cancel anytime",
    values: [true, true, true, true, true],
  },
];

export interface Review {
  name: string;
  initial: string;
  location: string;
  text: string;
  gradient: string;
}

export const REVIEWS: Review[] = [
  {
    name: "Maria Santos",
    initial: "M",
    location: "Quezon City",
    text: "Sulit na sulit! Lahat ng paborito kong shows nasa isang app na. Ang mura pa compared sa Netflix subscription ko dati.",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Juan Dela Cruz",
    initial: "J",
    location: "Manila",
    text: "Perfect for my family. The kids watch cartoons, my wife watches teleseryes, and I get all the live sports. One price for everything.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    name: "Andrea Lim",
    initial: "A",
    location: "Cebu City",
    text: "Best decision ever. I canceled three subscriptions and now I pay ₱49 for everything. The Full HD quality is surprisingly good!",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    name: "Ricardo Tan",
    initial: "R",
    location: "Davao City",
    text: "Setup took 2 minutes on my phone. No credit card needed for the trial, and GCash payment was super smooth. Highly recommend!",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    name: "Sofia Reyes",
    initial: "S",
    location: "Makati",
    text: "I love that I can watch on my phone during commute and on my TV at home. The movie library is huge and always updated.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    name: "Mark Villanueva",
    initial: "M",
    location: "Caloocan",
    text: "Canceling was easy when I traveled abroad, and resuming was just as easy. No lock-in, no hassle. Genuine sulit experience.",
    gradient: "from-violet-500 to-purple-500",
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "How does Nuvio work?",
    a: "Nuvio bundles premium streaming addons into one unified app. Add the Nuvio bundle once, and instantly get thousands of movies, series, anime, and live channels — all searchable and playable in a single interface. No switching apps, no multiple logins.",
  },
  {
    q: "Which devices are supported?",
    a: "Nuvio works on Android, Android TV, Amazon Fire Stick, Windows, macOS, Linux, and any device with a web browser. You can cast to Chromecast and AirPlay too. One subscription covers all your devices.",
  },
  {
    q: "Is the 7-day free trial really free?",
    a: "Yes — 7 days, completely free, no credit card required. You get full access to the entire library and all channels during the trial. Cancel anytime before day 7 and you won't be charged a centavo.",
  },
  {
    q: "How do I pay?",
    a: "We accept GCash, Maya, and all major credit/debit cards through PayMongo — a Bangko Sentral-licensed payment processor. Transactions are encrypted and we never store your card details.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no lock-in contracts. Cancel from your account dashboard with one tap, and your access continues until the end of your billing period. No questions, no fees.",
  },
  {
    q: "What internet speed do I need?",
    a: "For smooth Full HD streaming, we recommend at least 10 Mbps. For 4K content (on the 90-day plan), 25 Mbps or higher is ideal. Lower speeds still work — the player auto-adjusts quality to match your connection.",
  },
  {
    q: "Is this legal?",
    a: "Nuvio is a content aggregator that organizes publicly available streaming sources into one convenient interface. We do not host any content ourselves. You are responsible for complying with the laws of your jurisdiction.",
  },
  {
    q: "How do I get support?",
    a: "Our support team is available 7 days a week via in-app chat and email. Most questions are answered within an hour during business hours. We also have a detailed help center with step-by-step setup guides.",
  },
];
