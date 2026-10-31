import type { Metadata } from "next";
import "../globals.css";
import { AdminShell } from "../ui/AdminShell";

// Root layout for /admin — see AdminShell for why this branch has its own.

export const metadata: Metadata = {
    title: "Вход — Ritual",
    // Nothing here is for the public. robots.ts disallows these paths too;
    // this is the per-page half of the same statement.
    robots: { index: false, follow: false },
};

export default function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    // "center": the login form is short, so centering it reads as designed
    // rather than as a mostly-empty page.
    return <AdminShell align="center">{children}</AdminShell>;
}
