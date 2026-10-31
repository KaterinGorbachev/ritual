// npm i @formatjs/intl-localematcher negotiator
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, hasLocale } from "./app/lib/locales";

/** Session cookie written by /api/session after a verified sign-in. */
const ADMIN_COOKIE = "ritual:admin";

/** The login page. Outside /[lang] on purpose — the CRM is Russian-only. */
const LOGIN_PATH = "/admin";

/** Where a signed-in owner lands. The CRM has no Spanish or English copy. */
const DASHBOARD_PATH = "/dashboard";

function getSavedLocale(request) {
  const cookie = request.cookies.get(LOCALE_COOKIE);

  if (!cookie) return null;

  if (hasLocale(cookie.value)) {
    return cookie.value;
  }

  return null;
}
// Get the preferred locale, similar to the above or using a library
function getLocale(request) {
  const saved = getSavedLocale(request);
  if (saved) return saved;
  let headers = { "accept-language": request.headers.get("accept-language") ?? "" };
  let languages = new Negotiator({ headers }).languages();
  return match(languages, [...LOCALES], DEFAULT_LOCALE);
}

function pathnameHasLocale(pathname) {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return true;
    }
  }
  return false;
}

/**
 * Locale negotiation, plus the route gate for the CRM.
 *
 * ## The gate
 *
 * Reading a cookie is all this does — no Firebase call, no database read. The
 * Next.js auth guide is explicit that proxy runs on every route including
 * prefetches, so the check here stays optimistic and cheap.
 *
 * It is also not the real protection. Someone who forges `ritual:admin` gets
 * the dashboard shell with an empty catalogue and every write refused, because
 * their browser's Firestore connection is still unauthenticated and
 * `firestore.rules` checks the true identity. This gate exists so a logged-out
 * visitor sees the login page instead of a broken editor.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const signedIn = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);

  // /admin has no locale prefix and must never get one: /es/admin does not
  // exist and would 404. Handle it before any locale logic runs.
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    // Already signed in — no reason to show the form again.
    if (signedIn && pathname === LOGIN_PATH) {
      request.nextUrl.pathname = DASHBOARD_PATH;
      return NextResponse.redirect(request.nextUrl);
    }
    return;
  }

  // /dashboard is the CRM. It sits outside /[lang] for the same reason /admin
  // does (see app/ui/AdminShell.tsx) and needs the same locale exclusion:
  // without it, a signed-in visit falls through to the redirect at the bottom
  // of this function and gets rewritten to /es/dashboard, which 404s.
  if (pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`)) {
    if (!signedIn) {
      request.nextUrl.pathname = LOGIN_PATH;
      // Drop any query string from the blocked request rather than carrying
      // it to the login page.
      request.nextUrl.search = "";
      return NextResponse.redirect(request.nextUrl);
    }
    return;
  }

  // Already on a locale path — nothing to do.
  if (pathnameHasLocale(pathname)) {
    return;
  }

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Run on everything except Next internals, API routes and static assets.
    //
    // `api` is excluded because these are not pages: POST /api/reservations has
    // no locale prefix, so without this it was redirected to
    // /es/api/reservations and the booking never reached the handler.
    //
    // The trailing (?!...\\.\\w+$) skips any path ending in a file extension
    // (e.g. /Monet_....jpg, favicon.ico), so public files are served as-is
    // instead of being redirected to /es/<file>.
    "/((?!api|_next|.*\\.\\w+$).*)",
  ],
};
