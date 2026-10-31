import "server-only";
import { cookies } from "next/headers";

/**
 * The bridge between Firebase Auth (browser) and proxy.js (server).
 *
 * ## Why this exists
 *
 * Firebase keeps the signed-in user's ID token in browser memory / IndexedDB.
 * `proxy.js` runs on the server, before the page renders, and cannot see any of
 * that — it only sees cookies. So after a successful sign-in the client posts
 * its ID token to `/api/session`, this module verifies it and writes an
 * HttpOnly cookie, and from then on the proxy can gate `/dashboard`
 * without touching Firebase.
 *
 * ## What this cookie is and is not
 *
 * It is an *optimistic* route gate, in the sense the Next.js auth guide uses
 * the word: it decides what page to render, nothing more. It is deliberately
 * NOT the security boundary. The boundary is `firestore.rules`, which checks
 * `request.auth.uid` against `/admins/{uid}` on the real Firebase identity.
 *
 * The practical consequence: someone who forges this cookie gets a rendered
 * dashboard with an empty catalogue and every write rejected, because the
 * Firestore connection in their browser is still unauthenticated. That is the
 * intended failure mode — the page leaks no data and grants no writes.
 */

/** Session cookie name. Follows the `ritual:<name>` convention (see locales.ts). */
export const ADMIN_COOKIE = "ritual:admin";

/**
 * How long a sign-in lasts. Eight hours ~ one working day: the owner signs in
 * once in the morning and is asked again the next day. Short enough that a
 * forgotten session on a shared machine expires on its own.
 */
const MAX_AGE_SECONDS = 8 * 60 * 60;

/** Google's endpoint for exchanging an ID token for the account it belongs to. */
const LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

/**
 * Verify a Firebase ID token and return its uid, or null if it is not valid.
 *
 * Without `firebase-admin` the server cannot check the token's signature
 * offline, so it asks Google directly. An invalid, expired or tampered token
 * comes back as an error response and yields null.
 *
 * Adding `firebase-admin` would let this run locally and save the round trip,
 * at the cost of a service-account secret to store and rotate. At one sign-in
 * per day the round trip is the better trade.
 */
export async function verifyIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("verifyIdToken: NEXT_PUBLIC_FIREBASE_API_KEY is not set");
    return null;
  }
  if (typeof idToken !== "string" || idToken === "") return null;

  try {
    const response = await fetch(`${LOOKUP_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      // A sign-in check must never be served from a cache.
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data: unknown = await response.json();
    const users = (data as { users?: unknown }).users;
    if (!Array.isArray(users) || users.length === 0) return null;

    const uid = (users[0] as { localId?: unknown }).localId;
    return typeof uid === "string" && uid !== "" ? uid : null;
  } catch (error) {
    // Network failure, Google outage, malformed JSON — all mean "not verified".
    console.error("verifyIdToken: could not verify token:", error);
    return null;
  }
}

/** Write the session cookie for a verified uid. */
export async function createAdminSession(uid: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, uid, {
    // Not readable by JavaScript, so an XSS bug cannot exfiltrate the session.
    httpOnly: true,
    // Off on localhost, or the cookie is dropped over plain http in dev.
    secure: process.env.NODE_ENV === "production",
    // "lax" still sends the cookie on a top-level navigation to /dashboard,
    // which is what the proxy needs, while blocking cross-site POSTs.
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Clear the session cookie (log out). */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

/**
 * The uid in the session cookie, or null when there is none.
 *
 * Read this to decide what to render. Never treat it as proof the caller may
 * write — only Firestore rules can establish that.
 */
export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  return value && value !== "" ? value : null;
}
