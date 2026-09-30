import type { Metadata } from "next";
import "../globals.css";
import { AdminShell } from "../ui/AdminShell";

// Root layout for /dashboard — see AdminShell for why this branch has its own
// rather than living under app/[lang]/layout.tsx. Moved out of [lang] because
// the CRM has one operator and is Russian-only; a dictionary for it would be
// three files kept in sync for nobody.

export const metadata: Metadata = {
    title: "Панель управления — Ritual",
    // The CRM has no public content. robots.ts disallows /dashboard too; this
    // is the per-page half of the same statement.
    robots: { index: false, follow: false },
};

export default function DashboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    // "start": the catalogue can run long, so it scrolls from the top like an
    // ordinary page instead of being vertically centered and clipped.
    return <AdminShell align="start">{children}</AdminShell>;
}
