export function NavLink({ href, children, className = "", ...props }: React.ComponentProps<"a"> & { href: string }) {
    return (
        <a href={href} className={`${className} group flex px-2 py-1 rounded-pill border-2 border-transparent text-base font-normal tracking-wider leading-5 text-ink font-body   focus:border-mint active:text-magenta active:border-magenta transition-colors duration-500 ease-in-out `} data-testid="nav-link" {...props}>
            <span className="grid">
                {/* Invisible bold copy reserves the widest width so hover doesn't shift layout */}
                <span aria-hidden="true" className="col-start-1 row-start-1 font-bold invisible">
                    {children}
                </span>
                {/* Visible text: normal by default, bold on hover — same grid cell, no reflow */}
                <span className="col-start-1 row-start-1 group-hover:font-bold">
                    {children}
                </span>
            </span>
        </a>
    )
}
