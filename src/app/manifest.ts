import type { MetadataRoute } from "next";
export const runtime = "edge";

/**
 * Web App Manifest for PWA / mobile home-screen installation.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nuvio — All your streaming. One app.",
    short_name: "Nuvio",
    description:
      "Netflix, Disney+, HBO Max, Prime Video and 27 live channels — bundled into one Philippine streaming app. From ₱49/month.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    orientation: "portrait-primary",
    categories: ["entertainment", "video", "lifestyle"],
    icons: [
      {
        src: "https://i.ibb.co/J91qPG0/Logo-1080x1080.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "https://i.ibb.co/J91qPG0/Logo-1080x1080.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
