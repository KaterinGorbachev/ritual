"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../database/firebase.config";
import { FormField, describedBy } from "./FormField";

/**
 * Sign-in for the CRM at /admin.
 *
 * ## The two steps behind one button
 *
 * 1. `signInWithEmailAndPassword` authenticates with Firebase. From here on the
 *    browser's Firestore connection carries the owner's identity — which is
 *    what makes writes to `services` pass the security rules.
 * 2. The resulting ID token goes to `POST /api/session`, which verifies it,
 *    checks the uid is in `/admins`, and sets an HttpOnly cookie. `proxy.js`
 *    reads that cookie to decide whether to render the dashboard.
 *
 * Step 2 is what makes the *page* reachable; step 1 is what makes the *data*
 * writable. Both are needed, and they fail independently: an account that
 * signs in fine but is not in `/admins` gets rejected at step 2 with a message
 * saying so.
 *
 * The password never leaves this component — only the token Firebase returns is
 * sent to our server.
 *
 * Copy is Russian only, deliberately. The CRM has a single user and the rest of
 * the admin surface (DashboardPanel, the "Выйти" button) is already Russian; a
 * dictionary for one operator would be three files to keep in sync for nobody.
 * The public, customer-facing site stays fully trilingual.
 */

/** Where the owner lands after signing in. Outside /[lang] — see app/dashboard/layout.tsx. */
const DASHBOARD_PATH = "/dashboard";

/**
 * A human sentence for a Firebase Auth failure: what happened, and what to do.
 *
 * Kept here rather than in `firebaseErrors.js` because that module answers in
 * Spanish for the public site's Firestore errors, and this surface is Russian.
 * Mixing the two would put a Spanish sentence in a Russian panel.
 */
function messageForAuthError(code: unknown): string {
    switch (code) {
        // Firebase returns this same code for a wrong password, an unknown
        // email and a malformed one — deliberately, so nobody can probe which
        // addresses have accounts. The message has to cover all three.
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
        case "auth/invalid-email":
            return "Неверная почта или пароль. Проверьте раскладку клавиатуры и попробуйте снова";
        case "auth/user-disabled":
            return "Эта учётная запись отключена. Обратитесь к администратору";
        case "auth/too-many-requests":
            return "Слишком много попыток входа. Подождите несколько минут и попробуйте снова";
        case "auth/network-request-failed":
            return "Нет связи с сервером. Проверьте подключение к интернету и попробуйте снова";
        default:
            return "Не удалось войти. Попробуйте ещё раз или обратитесь к администратору";
    }
}

export function LoginForm() {
    const router = useRouter();
    const emailId = useId();
    const passwordId = useId();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);
    const [pending, setPending] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;

        setPending(true);
        // Clear the previous failure now, so the owner is not reading a stale
        // message while the new attempt is in flight.
        setError(undefined);

        try {
            // Trimmed: a trailing space from a paste or a phone keyboard is not
            // a real credential difference. The password is never trimmed —
            // spaces can legitimately be part of it.
            const credential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password,
            );

            const idToken = await credential.user.getIdToken();

            const response = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            const result: unknown = await response.json().catch(() => null);

            if (!response.ok || !(result as { ok?: boolean })?.ok) {
                // The server knows why (not an admin, token rejected) and
                // phrases it for a person; prefer its wording over a guess.
                setError(
                    (result as { message?: string })?.message ??
                        "Не удалось открыть панель. Попробуйте войти ещё раз",
                );
                setPending(false);
                return;
            }

            router.push(DASHBOARD_PATH);
            // The dashboard is a Server Component that was rendered for a
            // logged-out visitor. Without refresh() the cached logged-out
            // version is what gets shown.
            router.refresh();
        } catch (caught) {
            setError(messageForAuthError((caught as { code?: unknown })?.code));
            setPending(false);
        }
    }

    const inputClass =
        "min-h-11 w-full rounded-pill border-2 border-blush bg-cream px-4 py-2 font-body text-base text-ink placeholder:text-ink/60 focus:border-mint focus:outline-none disabled:opacity-60";

    return (
        <form
            onSubmit={handleSubmit}
            noValidate={false}
            data-testid="login-form"
            className="flex w-full max-w-md flex-col gap-6 px-4 pb-10"
        >
            <FormField
                id={emailId}
                label="Электронная почта"
                required
                testId="login-email"
            >
                <input
                    id={emailId}
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    disabled={pending}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-describedby={describedBy(emailId, {})}
                    className={inputClass}
                />
            </FormField>

            <FormField
                id={passwordId}
                label="Пароль"
                required
                testId="login-password"
            >
                <input
                    id={passwordId}
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    disabled={pending}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-describedby={describedBy(passwordId, {})}
                    className={inputClass}
                />
            </FormField>

            {/* role="alert" announces the failure the moment it appears — the
                owner is waiting on this outcome and cannot proceed without it. */}
            {error ? (
                <p
                    role="alert"
                    data-testid="login-error"
                    className="rounded-card border border-magenta/20 bg-blush/15 p-3 font-body text-sm text-ink/80"
                >
                    {error}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={pending}
                aria-busy={pending || undefined}
                data-testid="login-submit"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill bg-mint px-6 py-3 font-body font-bold tracking-wider text-ink shadow-sm transition duration-500 ease-in-out hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95 active:bg-magenta disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
            >
                {pending ? "Вход…" : "Войти"}
            </button>
        </form>
    );
}
