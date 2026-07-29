"use client";

// Booking button that opens a wa.me chat with the salon, message prefilled.
//
// The number is NOT fetched here. There is one salon number for the whole
// site; the server reads it once in layout.tsx and seeds the client-side
// Zustand store (via <WhatsAppStoreProvider>). This button just reads the
// store's `waLink()` builder — so every button on a page shares that one
// hydrated number with no extra Firestore round-trip.
import { useWhatsAppStore } from "../store/whatsappStore"

export function WhatsAppButton({
    message, children, className = "", ariaLabel
}: { message: string, children: React.ReactNode, className?: string, ariaLabel?: string }) {
    // waLink builds `https://wa.me/<digits>?text=<encoded message>` from the
    // number already in the store. Selecting the function (not the number)
    // keeps this component subscribed only to the builder identity.
    const waLink = useWhatsAppStore((s) => s.waLink)
    const href = waLink(message)

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={`inline-flex items-center justify-center gap-2 rounded-pill font-body font-bold text-base tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint bg-mint text-ink active:ring-magenta active:bg-magenta active:scale-95 hover:brightness-105 shadow-sm ${className}`} data-testid="whatsapp-button">
            {children}
        </a>

    )
}
