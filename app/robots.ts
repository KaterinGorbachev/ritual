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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // /api/ holds the reservation write endpoint — nothing indexable there.
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: ["/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
