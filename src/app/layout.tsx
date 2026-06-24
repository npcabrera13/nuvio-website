import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
    "Stremio",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuvio — All your streaming. One app.",
    description: "₱49/month. 7 days free, no credit card.",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
