"use client";

// Client-only for one reason: the mobile entrance reveal below needs an
// IntersectionObserver. Everything rendered here is still static presentational
// markup — no data fetching moved to the client.
import { useEffect, useRef, useState } from "react";

type ServiceCardProps = {
    title: string;
    description: string;
    className?: string;
    /** Path under /public, e.g. "/services/microcurrent.jpg". */
    image: string;
};

export function ServiceCard({ title, description, className = "", image }: ServiceCardProps) {
    const ref = useRef<HTMLLIElement>(null);
    const [inView, setInView] = useState(false);

    // Add `service-card--in-view` (which triggers the fade-rise) once the card
    // scrolls into the viewport. Same once-then-disconnect shape as TeamCard.
    // The animation itself is mobile-only and lives in globals.css — above the
    // single-column breakpoint the cards arrive two or three at a time and an
    // entrance per card reads as fussy, so the class simply does nothing there.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    io.disconnect(); // animate once, then stop observing
                }
            },
            { threshold: 0.25 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <li ref={ref} data-testid="service-card" className={`flex flex-col p-2 relative h-full min-h-72 w-full max-w-[350px] overflow-hidden rounded-card border border-blush/10 bg-cream/80 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] service-card ${inView ? "service-card--in-view" : ""} ${className}`}>

            <div className="flex flex-col items-start justify-center">
                <div className="w-full shrink-0 overflow-hidden rounded-card h-50 max-w-[350px] shadow-xs">
                    <img src={image} alt={title} className="w-full h-full object-cover object-center" />
                </div>
                <div className="flex h-full w-full flex-col items-start justify-start py-6 gap-2 pr-2">
                    <h3 className="font-display text-2xl tracking-normal text-ink">{title}</h3>
                    <p className="mt-2 font-body text-base leading-relaxed tracking-normal text-ink/75 ">
                    {description}
                </p>
                </div>
            </div>






        </li>
    );
}
