import { getDocById } from "../lib/handleData"

export async function WhatsAppButton({
    message, children, className = ""
}: { message: string, children: React.ReactNode, className?: string }) {
    // Source the WhatsApp number from the "messanger" document in the
    // "ContactData" collection (field: telephone).
    let number = "";
    const response = await getDocById("ContactData", "messanger");
    if (response.ok) {
        const contact = response.data as { telephone?: string } | undefined;
        number = contact?.telephone ?? "";
    }

    // Build a wa.me link: digits only, plus the prefilled message.
    const digits = number.replace(/\D/g, "");
    const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-pill font-body font-bold text-base tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint bg-mint text-ink active:ring-magenta active:bg-magenta active:scale-95 hover:brightness-95 shadow-sm ${className}`} data-testid="whatsapp-button">
            {children}
        </a>

    )
}
