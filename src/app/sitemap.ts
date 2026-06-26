import type { MetadataRoute } from "next";
export const runtime = "edge";

/**
 * sitemap.xml — generated at /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://nuviostreamapi.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
