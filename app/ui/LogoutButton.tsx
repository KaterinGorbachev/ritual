"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../database/firebase.config";

/**
 * "Выйти" — ends the CRM session.
 *
 * Two things have to be undone, and both matter:
 *   1. `signOut(auth)` drops the Firebase identity, so the browser's Firestore
 *      connection stops being able to write.
 *   2. `DELETE /api/session` clears the HttpOnly cookie, so `proxy.js` stops
 *      letting the dashboard render.
 *
 * Doing only the first would leave a cookie that renders an unusable dashboard;
 * doing only the second would leave a browser that can still write to Firestore.
 * The cookie is cleared even if sign-out throws, so a network blip cannot strand
 * someone in a session they asked to end.
 */
export function LogoutButton() {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function handleLogout() {
        if (pending) return;
        setPending(true);

        try {
            await signOut(auth);
        } catch (error) {
            // Log it, but carry on to clear the cookie: the user asked to
            // leave, and a failed sign-out must not keep them signed in.
            console.error("LogoutButton: Firebase sign-out failed:", error);
        }

        try {
            await fetch("/api/session", { method: "DELETE" });
        } catch (error) {
            console.error("LogoutButton: could not clear the session cookie:", error);
        }

        router.push("/admin");
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            aria-busy={pending || undefined}
            data-testid="dashboard-logout"
            className="font-body font-bold text-base text-mauve tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-mauve text-ink-60 rounded-pill border-2 cursor-pointer active:ring-magenta active:bg-magenta active:scale-95 hover:bg-mauve hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
            {pending ? "Выход…" : "Выйти"}
        </button>
    );
}
