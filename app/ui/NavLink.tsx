export function NavLink({ href, children, className = "" }: { href: string, children: React.ReactNode, className?: string }) {
    return (
        <a href={href} className={`${className} flex px-2 py-1 rounded-pill border-2 border-transparent text-base font-normal tracking-wider leading-5 text-ink font-body   hover:font-bold focus:underline active:text-magenta `} data-testid="nav-link">
            {children}
        </a>
    )
}
