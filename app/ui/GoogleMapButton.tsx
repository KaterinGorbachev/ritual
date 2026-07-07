export function GoogleMapButton({
    link, children, className = ""
}: { link: string, children: React.ReactNode, className?: string }) {    

    return (
        <a href={link} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-pill font-body font-bold text-base tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint bg-blush text-ink active:ring-magenta active:bg-magenta  active:scale-95 hover:brightness-95 shadow-sm border-2 border-transparent ${className}`} data-testid="whatsapp-button">
            {children}
        </a>

    )
}