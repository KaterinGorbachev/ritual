type GostButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "ghost";
};

export function GostButton({
    className = "",
    variant = "ghost",
    children,
    ...props
}: GostButtonProps) {
    return (
        <button
            className={`${variant === "ghost" ? "border bg-cream/50 text-iris border-iris/40 " : "bg-blush text-ink"} rounded-pill min-w-11 min-h-11 font-body cursor-pointer hover:brightness-125 focus:border-mint active:border-magenta disabled:opacity-25 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
