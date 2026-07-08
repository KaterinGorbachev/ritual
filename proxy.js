// npm i @formatjs/intl-localematcher negotiator
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

let locales = ["en", "ru", "es"];
let defaultLocale = "es";

// Get the preferred locale, similar to the above or using a library
function getLocale(request) {
  let headers = { "accept-language": request.headers.get("accept-language") ?? "" };
  let languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function proxy(request) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

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
