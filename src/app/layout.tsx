import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/nuvio/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nuvio — All your streaming. One app. ₱49/month.",
  description:
    "Nuvio bundles Netflix, Disney+, HBO Max, Prime Video and 27 live channels into one Philippine streaming app. 7 days free, no credit card. From ₱49/month.",
  keywords: [
    "Nuvio",
    "Philippine streaming",
    "Netflix Philippines",
    "live TV Philippines",
    "GCash streaming",
    "cheap streaming PH",
  ],
  authors: [{ name: "Nuvio" }],
  icons: {
    icon: "https://i.ibb.co/J91qPG0/Logo-1080x1080.png",
  },
  openGraph: {
    title: "Nuvio — All your streaming. One app.",
    description: "Netflix + Disney+ + HBO + 27 live channels. ₱49/month. 7 days free.",
    siteName: "Nuvio",
    type: "website",
    images: ["https://i.ibb.co/J91qPG0/Logo-1080x1080.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuvio — All your streaming. One app.",
    description: "₱49/month. 7 days free, no credit card.",
    images: ["https://i.ibb.co/J91qPG0/Logo-1080x1080.png"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Nuvio Streaming Bundle",
  description:
    "All-in-one Philippine streaming app bundling movies, series, anime, and 27 live channels. From ₱49/month with a 7-day free trial.",
  brand: { "@type": "Brand", name: "Nuvio" },
  logo: "https://i.ibb.co/J91qPG0/Logo-1080x1080.png",
  offers: {
    "@type": "Offer",
    priceCurrency: "PHP",
    price: "49",
    availability: "https://schema.org/InStock",
    url: "https://nuviostreamapi.vercel.app",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "2400",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
