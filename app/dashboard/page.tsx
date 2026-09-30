import { redirect } from "next/navigation";
import { Section } from "../ui/Section";
import { DashboardPanel } from "../ui/DashboardPanel";
import { LogoutButton } from "../ui/LogoutButton";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/app/lib/authSession";

/**
 * The CRM. Editing the service catalogue.
 *
 * ## Why the Firestore writes are not server actions any more
 *
 * They used to be: `addService`, `updateService` and `deleteService` lived here
 * as `"use server"` functions. The problem was not that they were unguarded —
 * it is that they *could not* be guarded in the way that matters. A server
 * action runs on the Node server, where the Firebase client SDK holds no
 * signed-in user, so every write arrived at Firestore as an anonymous request.
 * For those writes to succeed the security rules had to allow anonymous writes,
 * which means anyone could write to `services` with a few lines of script and
 * the public API key — no dashboard, no password, no server action involved.
 *
 * So the writes moved into the browser, where the owner's Firebase identity
 * actually exists. `firestore.rules` now requires `/admins/{uid}` for any write
 * to `services`, and that rule is enforced by Firestore itself rather than by
 * code that can be bypassed.
 *
 * What is left here is a cache refresh, which is not a mutation and is
 * therefore safe to leave open: the worst a stranger can do by calling it is
 * make two pages re-render.
 */

// The editor must always show what is in Firestore right now, not a build-time
// copy — and it reads the session cookie, which cannot be prerendered.
export const dynamic = "force-dynamic";

// Rebuild the public Services page in every locale (new prices show right
// away) and this page. /[lang]/services still has a locale segment;
// /dashboard no longer does, now that it lives outside [lang].
export async function refreshCatalogue() {
    "use server";
    revalidatePath("/[lang]/services", "page");
    revalidatePath("/dashboard", "page");
}

export default async function DashboardPage() {
    // The proxy already redirects a logged-out visitor, so this is the second
    // of two checks. It is here because the proxy can be bypassed (a
    // misconfigured matcher, a direct render) and because the Next.js auth
    // guide is explicit that proxy checks should not be the only ones.
    //
    // Neither check is what protects the *data* — that is firestore.rules.
    // This one decides whether to render a page.
    if (!(await getAdminSession())) {
        redirect("/admin");
    }

    return (
        <Section>

            <div className="flex w-full flex-col items-center justify-center bg-cream/89 rounded-pill mb-8 lg:mb-10 ">
                {/* --- Page header: eyebrow, title, description, then the search bar --- */}
                <header className="flex w-full flex-col items-center gap-3 text-center  py-8 px-4 max-w-3xl">
                    <p className="font-handwriting text-3xl leading-none text-magenta"></p>
                    <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
                        Управление контентом
                    </h1>
                    <LogoutButton />
                </header>
            </div>
            {/** main page */}
            <DashboardPanel onSaved={refreshCatalogue}></DashboardPanel>


        </Section>
    )
}
