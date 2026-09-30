import { Playfair_Display, Nunito, Caveat } from "next/font/google";

/**
 * The `<html>`/`<body>` shell shared by `/admin` and `/dashboard`.
 *
 * ## Why this exists
 *
 * Every route needs a root layout with `<html>` and `<body>`. The public site
 * gets one from `app/[lang]/layout.tsx`. `/admin` and `/dashboard` sit outside
 * `[lang]` — deliberately, the CRM is Russian-only and has one operator — so
 * each is its own root layout (Next's documented "multiple root layouts"
 * pattern: any layout with no layout above it is a root layout).
 *
 * Without this, each of those layouts would either duplicate the font setup or
 * drift from it one edit at a time. This component is the one place fonts and
 * the cream/ink base are defined for both.
 *
 * `next/font/google` runs its build-time pipeline wherever this module is
 * imported, so the two call sites (`app/admin/layout.tsx`,
 * `app/dashboard/layout.tsx`) each get their own font-loading — sharing this
 * component doesn't create a duplicate network fetch, Next dedupes identical
 * font calls at build time.
 *
 * Deliberately bare: no header, footer, WhatsApp button or bubble canvas. This
 * is a working surface behind a password; the marketing chrome would be noise.
 */

const playfair = Playfair_Display({
    variable: "--font-display",
    subsets: ["latin", "cyrillic"],
});

const nunito = Nunito({
    variable: "--font-body",
    subsets: ["latin", "cyrillic"],
});

const caveat = Caveat({
    variable: "--font-handwriting",
    subsets: ["latin"],
});

export function AdminShell({
    children,
    /**
     * "center" for a short form (the login page) — "start" for a page whose
     * content can outgrow the viewport (the dashboard), so it scrolls normally
     * instead of being vertically centered and clipped.
     */
    align = "start",
}: {
    children: React.ReactNode;
    align?: "start" | "center";
}) {
    return (
        <html
            lang="ru"
            className={`${playfair.variable} ${nunito.variable} ${caveat.variable} h-full antialiased`}
        >
            <body
                className={`min-h-full flex flex-col items-center ${align === "center" ? "justify-center" : "justify-start"} bg-cream text-ink font-body`}
            >
                {children}
            </body>
        </html>
    );
}
