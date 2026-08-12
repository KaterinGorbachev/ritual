// Public origin of the site. Set NEXT_PUBLIC_SITE_URL in the hosting env for
// production; the fallback keeps builds working before a custom domain is wired
// up. It only ever affects absolute URLs in metadata/JSON-LD, never rendering.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ritualstudio.vercel.app"
).replace(/\/$/, "");

// Stable JSON-LD node ids. Using @id lets blocks on different pages point at the
// same business entity instead of describing three separate salons — that is what
// lets search engines merge them into one listing.
export const ORG_ID = `${SITE_URL}/#business`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Turn a root-relative path ("/es") into an absolute URL. */
export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
