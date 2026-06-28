
export function BurgerMenuButton({
     className = "", ariaLabel = "Toggle menu", disabled = false
}: {
    
    className?: string;
    ariaLabel?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            className={`cursor-pointer group inline-flex items-center justify-center gap-1.5 rounded-pill min-h-11 min-w-11 px-4 py-3 border-2 border-transparent bg-cream/80 backdrop-blur shadow-sm transition duration-500 ease-in-out focus:outline-none focus:border-mint hover:bg-cream  hover:border-mint active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            data-testid="burger-menu-button"
        >
            
            <span className="block h-2.5 w-2.5 rounded-full bg-mint transition-colors duration-500 ease-in-out group-focus:bg-lilac group-active:bg-lilac" />
            <span className="block h-2.5 w-2.5 rounded-full bg-lilac transition-colors duration-500 ease-in-out group-focus:bg-blush group-active:bg-blush" />
            <span className="block h-2.5 w-2.5 rounded-full bg-blush transition-colors duration-500 ease-in-out group-focus:bg-mint group-active:bg-mint" />
        </button>
    );
}
