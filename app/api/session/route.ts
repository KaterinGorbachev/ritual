import { NextResponse } from "next/server";
import {
    verifyIdToken,
    createAdminSession,
    destroyAdminSession,
} from "../../lib/authSession";

// Sets and clears a cookie per request — never cached, never prerendered.
export const dynamic = "force-dynamic";

/** Collection whose document ids are the uids allowed into the CRM. */
const ADMINS = "admins";

/**
 * Is this uid allowed into the CRM?
 *
 * Reads `/admins/{uid}` over Firestore's REST API **as the signed-in user**,
 * by passing their ID token as a bearer token.
 *
 * It has to be done this way. The obvious version — `getDoc(doc(db, ADMINS,
 * uid))` with the client SDK imported here — runs on the server, where that SDK
 * has no signed-in user, so the request arrives at Firestore anonymously. The
 * published rules restrict `/admins` to admins (`allow read: if isAdmin()`), so
 * an anonymous read is refused with `permission-denied` for *everyone*,
 * including the real owner. That is not a rule to loosen: `/admins` is the
 * permission list, and making it world-readable would publish exactly which
 * accounts to attack.
 *
 * Sending the token makes `request.auth` non-null on Firestore's side, so
 * `isAdmin()` evaluates properly and the owner's own document is readable by
 * them.
 */
async function isAdminUid(uid: string, idToken: string): Promise<boolean> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
        console.error("isAdminUid: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
        return false;
    }

    const url =
        `https://firestore.googleapis.com/v1/projects/${projectId}` +
        `/databases/(default)/documents/${ADMINS}/${encodeURIComponent(uid)}`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${idToken}` },
            cache: "no-store",
        });

        // 200 = the document exists and the rules allowed this user to read it.
        // 404 = signed in, but not on the list. 403 = the rules refused.
        return response.ok;
    } catch (error) {
        // A network failure must not grant access.
        console.error("isAdminUid: could not read /admins:", error);
        return false;
    }
}

/**
 * `POST /api/session` — turn a verified Firebase ID token into a session cookie.
 * `DELETE /api/session` — clear it.
 *
 * ## Why a route handler and not a server action
 *
 * The client has to hand over a value (the ID token) and get a `Set-Cookie`
 * back. That is a request/response exchange at a moment the user chooses, which
 * is what a route handler is for — a page's Server Component has already
 * finished rendering by the time anyone types a password.
 *
 * ## The two checks
 *
 * 1. Is the token real? `verifyIdToken` asks Google. A forged or expired token
 *    stops here.
 * 2. Is this user an admin? The uid must have a document in `/admins`. Without
 *    this, *any* Firebase account in the project — including one created
 *    through some other sign-in method — would get a dashboard cookie.
 *
 * Note the second check reads `/admins/{uid}` with the anonymous client SDK,
 * and the published rules only allow an admin to read that collection. The read
 * therefore fails for a non-admin, which is the answer we want ("not an
 * admin"), just arrived at through a permission error rather than a missing
 * document. Both outcomes are treated the same way below, so the check is
 * correct either way.
 */
export async function POST(request: Request) {
    let idToken: unknown;
    try {
        const body: unknown = await request.json();
        idToken = (body as { idToken?: unknown })?.idToken;
    } catch {
        return NextResponse.json(
            { ok: false, message: "Не удалось прочитать запрос. Попробуйте ещё раз" },
            { status: 400 },
        );
    }

    if (typeof idToken !== "string" || idToken.trim() === "") {
        return NextResponse.json(
            { ok: false, message: "Не удалось войти. Попробуйте ещё раз" },
            { status: 400 },
        );
    }

    const uid = await verifyIdToken(idToken);
    if (!uid) {
        return NextResponse.json(
            { ok: false, message: "Не удалось подтвердить вход. Попробуйте ещё раз" },
            { status: 401 },
        );
    }

    if (!(await isAdminUid(uid, idToken))) {
        return NextResponse.json(
            { ok: false, message: "У этой учётной записи нет доступа к панели" },
            { status: 403 },
        );
    }

    await createAdminSession(uid);
    return NextResponse.json({ ok: true });
}

export async function DELETE() {
    await destroyAdminSession();
    return NextResponse.json({ ok: true });
}
