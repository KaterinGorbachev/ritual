import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

// Crawlers behind AI answers. Next has no built-in AI-crawler rules — it emits
// exactly the user agents named here — so allowing them has to be explicit.
// Grouped by purpose:
//   - *-SearchBot / *-User fetch pages live to cite in an answer
//   - GPTBot / ClaudeBot / Google-Extended gate training and grounding
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User", // OpenAI
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai", // Anthropic
  "PerplexityBot",
  "Perplexity-User", // Perplexity
  "Google-Extended", // Gemini / AI Overviews grounding
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl — feeds many models
  "Amazonbot",
  "Bytespider",
  "meta-externalagent",
];

// Paths with nothing to index. /admin and /dashboard sit outside /[lang] (see
// app/ui/AdminShell.tsx), so a plain prefix match is enough — no per-locale
// entries needed, unlike a path that lives under [lang].
const ADMIN_PATHS = ["/api/", "/admin", "/dashboard"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // /api/ holds the reservation write endpoint — nothing indexable there.
      // /admin and /dashboard are the CRM: no public content, and a login page
      // in search results is only an invitation to try passwords. This hides
      // them from honest crawlers; the proxy and the Firestore rules are what
      // actually keep them shut.
      { userAgent: "*", allow: "/", disallow: ADMIN_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: ADMIN_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
