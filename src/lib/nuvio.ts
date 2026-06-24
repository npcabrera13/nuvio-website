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
  | "Discovery";

export interface NuvioChannel {
  name: string;
  short: string;
  category: ChannelCategory;
  /** Brand color for the styled tile background (gradient or solid). */
  color: string;
  /** Whether a real logo URL is available; otherwise we render a styled text tile. */
  hasLogo: boolean;
  logoUrl?: string;
}

/**
 * Live channels included with Nuvio.
 * Only well-known, verifiable channels are listed. Each tile uses the brand's
 * signature color for instant recognition.
 */
export const CHANNELS: NuvioChannel[] = [
  // Philippine free-to-air
  { name: "GMA Network", short: "GMA", category: "Philippine", color: "#e2241a", hasLogo: false },
  { name: "GTV", short: "GTV", category: "Philippine", color: "#1a1a2e", hasLogo: false },
  { name: "A2Z", short: "A2Z", category: "Philippine", color: "#0066b3", hasLogo: false },
  { name: "TV5", short: "TV5", category: "Philippine", color: "#d32f2f", hasLogo: false },
  { name: "IBC 13", short: "IBC", category: "Philippine", color: "#1565c0", hasLogo: false },
  { name: "PTV 4", short: "PTV", category: "Philippine", color: "#0d47a1", hasLogo: false },
  { name: "Net 25", short: "NET25", category: "Philippine", color: "#2e7d32", hasLogo: false },
  { name: "RPN 9", short: "RPN", category: "Philippine", color: "#37474f", hasLogo: false },
  // News
  { name: "Al Jazeera", short: "AJ+", category: "News", color: "#fa9200", hasLogo: false },
  { name: "BBC World News", short: "BBC", category: "News", color: "#bb1919", hasLogo: false },
  { name: "CNN", short: "CNN", category: "News", color: "#cc0000", hasLogo: false },
  { name: "ABS-CBN News", short: "ANC", category: "News", color: "#003399", hasLogo: false },
  // Kids
  { name: "Cartoon Network", short: "CN", category: "Kids", color: "#000000", hasLogo: false },
  { name: "Disney Channel", short: "DIS", category: "Kids", color: "#0b3a8c", hasLogo: false },
  { name: "Nickelodeon", short: "NICK", category: "Kids", color: "#ff7900", hasLogo: false },
  { name: "Animax", short: "AX", category: "Kids", color: "#1a237e", hasLogo: false },
  // Movies
  { name: "HBO", short: "HBO", category: "Movies", color: "#000000", hasLogo: false },
  { name: "Cinemax", short: "MAX", category: "Movies", color: "#4a148c", hasLogo: false },
  { name: "Warner TV", short: "WT", category: "Movies", color: "#f5783f", hasLogo: false },
  { name: "AXN", short: "AXN", category: "Movies", color: "#1a1a1a", hasLogo: false },
  // Entertainment
  { name: "FX", short: "FX", category: "Entertainment", color: "#0a0a0a", hasLogo: false },
  { name: "Comedy Central", short: "CC", category: "Entertainment", color: "#1a1a1a", hasLogo: false },
  // Sports
  { name: "ESPN", short: "ESPN", category: "Sports", color: "#d50032", hasLogo: false },
  { name: "Premier Sports", short: "PS", category: "Sports", color: "#0b5394", hasLogo: false },
  // Discovery
  { name: "Discovery", short: "DISC", category: "Discovery", color: "#0b3d91", hasLogo: false },
  { name: "Nat Geo", short: "NGC", category: "Discovery", color: "#ffcc00", hasLogo: false },
  { name: "Animal Planet", short: "AP", category: "Discovery", color: "#0066b3", hasLogo: false },
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
    duration: "30 Days",
    price: 49,
    perDay: "₱1.63 per day",
    features: ["Full movie & series library", "All 27 live channels", "1080p streaming", "1 device"],
  },
  {
    id: "90",
    duration: "90 Days",
    price: 129,
    perDay: "₱1.43 per day",
    badge: "BEST VALUE",
    highlight: true,
    features: ["Everything in 30 Days", "Priority stream servers", "4K where available", "2 devices", "Early access to new content"],
  },
  {
    id: "60",
    duration: "60 Days",
    price: 89,
    perDay: "₱1.48 per day",
    features: ["Full movie & series library", "All 27 live channels", "1080p streaming", "1 device"],
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
  { name: "Prime Video", slug: "amazonprimevideo" },
  { name: "Disney+", slug: null, png: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/disney-plus.png" },
  { name: "HBO Max", slug: null, png: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/hbo-max.png" },
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
    values: ["27", false, false, false, false],
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
    text: "Best decision ever. I canceled three subscriptions and now I pay ₱49 for everything. The 1080p quality is surprisingly good!",
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
    a: "Nuvio bundles premium streaming addons into one unified app. Add the Nuvio bundle once, and instantly get thousands of movies, series, anime, and 27 live channels — all searchable and playable in a single interface. No switching apps, no multiple logins.",
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
    a: "For smooth 1080p streaming, we recommend at least 10 Mbps. For 4K content (on the 90-day plan), 25 Mbps or higher is ideal. Lower speeds still work — the player auto-adjusts quality to match your connection.",
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
