"use client";

import { useEffect, useRef, useState } from "react";

type TeamCardProps = {
    name: string;
    profession: string,
    description: string,
    image: string;
    className?: string;

}

export function TeamCard({
    name, profession, description, image, className = ""
}: TeamCardProps) {
    const ref = useRef<HTMLLIElement>(null);
    const [inView, setInView] = useState(false);

    // Add `team-card--in-view` (which triggers the slide-in animation) only once
    // the card scrolls into the viewport.
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
        <li ref={ref} data-testid="team-card" className={`flex items-stretch justify-between gap-4 p-2 relative min-h-72 w-full overflow-hidden rounded-card border border-blush/10 bg-cream/80 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] team-card ${inView ? "team-card--in-view" : ""} ${className}`}>
            <div className="relative w-full shrink-0 overflow-hidden rounded-card max-w-[250px] shadow-xs max-h-[300px] md:max-h-full">
                <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover object-center" />
            </div>
            <div className="flex w-full flex-col items-start justify-start py-6 gap-2 pr-2">
                <div>
                    <h3 className="font-display text-2xl tracking-normal text-ink text-start">{name}</h3>
                    <p className="mt-2 font-body text-sm leading-relaxed tracking-normal text-iris/75 text-start">{profession}</p>
                </div>
                <p className="mt-2 font-body text-base leading-relaxed tracking-normal text-ink/75 pr-4">
                    {description}
                </p>
            </div>
        </li>
    )
}
