export function WhatsAppButton({
    number, message, children
}: { number: string, message: string, children: React.ReactNode, disabled?: boolean }) {
    return (
        <a href="" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-pill font-body font-bold tracking-wider px-6 py-3 min-h-[44px] min-w-[44px] transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint bg-mint text-ink active:ring-magenta active:bg-magenta active:scale-95 hover:brightness-95 disabled:opacity-50 disabled:pointer-events-none">
            {children}
        </a>

    )
}