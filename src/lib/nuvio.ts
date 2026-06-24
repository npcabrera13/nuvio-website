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
      .map((m) => ({
        id: m.id ?? m.imdb_id ?? "",
        name: m.name ?? "Untitled",
        year: m.year ?? null,
        imdbRating: m.imdbRating && m.imdbRating !== "" ? m.imdbRating : null,
        genres: m.genres ?? m.genre ?? [],
        description: m.description ?? null,
        poster: m.poster as string,
        background: m.background as string,
        logo: m.logo ?? null,
        runtime: m.runtime ?? null,
        cast: m.cast ?? [],
      }));
    return movies.slice(0, limit);
  } catch {
    return [];
  }
}

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
  /** Whether a real logo URL is available; otherwise we render a styled text tile. */
  hasLogo: boolean;
  logoUrl?: string;
}

/**
 * The full lineup of 27 live channels offered by the Nuvio bundle.
 * Channels without reliable logos use a premium styled text tile (per spec).
 */
export const CHANNELS: NuvioChannel[] = [
  // Philippine
  { name: "GMA Network", short: "GMA", category: "Philippine", hasLogo: false },
  { name: "GMA News TV", short: "GNTV", category: "Philippine", hasLogo: false },
  { name: "A2Z Channel 11", short: "A2Z", category: "Philippine", hasLogo: false },
  { name: "TV5", short: "TV5", category: "Philippine", hasLogo: false },
  { name: "ABS-CBN", short: "ABSCBN", category: "Philippine", hasLogo: false },
  { name: "Jeepney TV", short: "JTV", category: "Philippine", hasLogo: false },
  { name: "Heart of Asia", short: "HOA", category: "Philippine", hasLogo: false },
  { name: "Pinoy Hits", short: "PHITS", category: "Philippine", hasLogo: false },
  // News
  { name: "Al Jazeera English", short: "AJE", category: "News", hasLogo: false },
  { name: "BBC World News", short: "BBC", category: "News", hasLogo: false },
  { name: "CNN International", short: "CNN", category: "News", hasLogo: false },
  { name: "CBS News 24/7", short: "CBS", category: "News", hasLogo: false },
  // Kids
  { name: "Disney XD", short: "DXD", category: "Kids", hasLogo: false },
  { name: "Cartoon Network", short: "CN", category: "Kids", hasLogo: false },
  { name: "Baby Shark TV", short: "BSTV", category: "Kids", hasLogo: false },
  { name: "Tom & Jerry", short: "T&J", category: "Kids", hasLogo: false },
  { name: "Toon Goggles", short: "TOON", category: "Kids", hasLogo: false },
  { name: "LEGO Channel", short: "LEGO", category: "Kids", hasLogo: false },
  // Movies
  { name: "HBO", short: "HBO", category: "Movies", hasLogo: false },
  { name: "Cinemax", short: "MAX", category: "Movies", hasLogo: false },
  { name: "Warner TV", short: "WT", category: "Movies", hasLogo: false },
  // Entertainment
  { name: "AXN", short: "AXN", category: "Entertainment", hasLogo: false },
  { name: "CLTC 36", short: "CLTC", category: "Entertainment", hasLogo: false },
  // Sports
  { name: "Premier Sports", short: "PS", category: "Sports", hasLogo: false },
  { name: "PBA Rush", short: "PBA", category: "Sports", hasLogo: false },
  // Discovery
  { name: "Discovery Channel", short: "DISC", category: "Discovery", hasLogo: false },
  { name: "National Geographic", short: "NATGEO", category: "Discovery", hasLogo: false },
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
    a: "Nuvio bundles premium streaming addons into one Stremio-powered app. Add the Nuvio bundle once, and instantly get thousands of movies, series, anime, and 27 live channels — all searchable and playable in a single interface. No switching apps, no multiple logins.",
  },
  {
    q: "Which devices are supported?",
    a: "Nuvio works on Android, Android TV, Amazon Fire Stick, Windows, macOS, Linux, and any device that runs Stremio. You can cast to Chromecast and AirPlay too. One subscription covers all your devices.",
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
