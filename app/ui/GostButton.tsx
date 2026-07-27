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
            className={`${variant === "ghost" ? "hover:border-2 bg-cream/80 text-iris/80  hover:brightness-95 hover:border-magenta " : "bg-blush text-ink hover:brightness-125"} rounded-pill min-w-6 min-h-6 font-body cursor-pointer  focus:border-mint active:border-magenta disabled:opacity-25 disabled:cursor-not-allowed transition duration-500 ease-in-out ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
