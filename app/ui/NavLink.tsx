export function NavLink({ href, children, className = "", ...props }: React.ComponentProps<"a"> & { href: string }) {
    return (
        <a href={href} className={`${className} flex px-2 py-1 rounded-pill border-2 border-transparent text-base font-normal tracking-wider leading-5 text-ink font-body   hover:font-bold focus:border-mint active:text-magenta active:border-magenta `} data-testid="nav-link" {...props}>
            {children}
        </a>
    )
}
