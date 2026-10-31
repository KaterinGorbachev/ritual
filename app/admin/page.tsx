import { redirect } from "next/navigation";
import { Section } from "../ui/Section";
import { LoginForm } from "../ui/LoginForm";
import { getAdminSession } from "../lib/authSession";

/**
 * `/admin` — sign-in for the CRM.
 *
 * ## Why this route sits outside `[lang]`
 *
 * Every other page is `/[lang]/…` and exists in Russian, Spanish and English.
 * This one does not: the CRM has a single operator and the dashboard it leads
 * to is already Russian-only. Three dictionaries for one person would be three
 * files to keep in sync for no reader.
 *
 * The consequence is handled in `proxy.js`: `/admin` is excluded from locale
 * redirection there. Without that exclusion the proxy rewrites it to
 * `/es/admin`, which does not exist, and the login page 404s.
 */

// Reads the session cookie, so it cannot be prerendered at build time.
export const dynamic = "force-dynamic";

// Title and robots directives live in layout.tsx, which is this branch's root
// layout — see the note there.

export default async function AdminLoginPage() {
    // Already signed in? Skip the form. The proxy does this too; repeating it
    // here means a direct render (or a proxy that was bypassed) behaves the
    // same way.
    if (await getAdminSession()) {
        redirect("/dashboard");
    }

    return (
        <Section>
            <div className="flex w-full flex-col items-center justify-center bg-cream/89 rounded-pill mb-8 lg:mb-10 ">
                {/* --- Page header: title, then the sign-in form --- */}
                <header className="flex w-full flex-col items-center gap-3 text-center  py-8 px-4 max-w-3xl">
                    <p className="font-handwriting text-3xl leading-none text-magenta"></p>
                    <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
                        Управление контентом
                    </h1>
                    <h2 className="font-display text-[clamp(1.75rem,5vw,2.25rem)] font-semibold text-ink/80">
                        Вход
                    </h2>
                </header>
                <main className="flex w-full flex-col items-center">
                    <LoginForm />
                </main>
            </div>
        </Section>
    );
}
