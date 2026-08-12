import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";
import { LOCALES } from "./lib/locales";

// One entry per route, expanded across every locale below. Add
// { path: "/services", … } here once that page has its own metadata — leaving it
// out doesn't hide the page (crawlers still follow links), it just isn't
// advertised until it's ready.
const ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  // Rarely changes, and nobody searches for it — but it must be indexable, so
  // it is advertised rather than left to be discovered through the footer.
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Evaluated at build time (cached route handler, no request-time API), so this
  // reflects the deploy date rather than "now" on every request.
  const lastModified = new Date();

  return ROUTES.flatMap(({ path, priority, changeFrequency }) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      // Each entry declares its siblings, so a crawler learns the three language
      // versions are one page rather than three competing ones.
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
