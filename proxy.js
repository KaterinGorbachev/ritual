// npm i @formatjs/intl-localematcher negotiator
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, hasLocale } from "./app/lib/locales";

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

export function proxy(request) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
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
    // Run on everything except Next internals and static assets.
    // The trailing (?!...\\.\\w+$) skips any path ending in a file extension
    // (e.g. /Monet_....jpg, favicon.ico), so public files are served as-is
    // instead of being redirected to /es/<file>.
    "/((?!_next|.*\\.\\w+$).*)",
  ],
};
