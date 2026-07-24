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
        <li ref={ref} data-testid="team-card" className={`relative flex-col md:flex-row flex items-center justify-center gap-4 py-4 md:p-2 min-h-72 w-full rounded-pill md:rounded-full overflow-hidden border border-blush/10 bg-cream/80 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] team-card max-w-[800px] min-w-0 lg:min-w-[655px] ${inView ? "team-card--in-view" : ""} ${className}`}>
            <div className="relative shrink-0 overflow-hidden rounded-full w-[290px] shadow-xs h-[290px] ">
                <img src={image} alt={name} className="w-full h-full object-cover object-center" />
            </div>
            <div className={`flex flex-col transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] md:static md:inset-auto md:z-auto md:translate-x-0 md:opacity-100 md:pointer-events-auto bg-transparent md:flex w-full items-center md:items-start justify-center pt-4 pb-10 gap-2 md:pr-2 md:px-0 rounded-card `}>
                <div>
                    <h3 className="font-display text-2xl tracking-normal text-ink text-center md:text-start">{name}</h3>
                    <p className="mt-2 font-body text-sm leading-relaxed tracking-normal text-iris/75 text-center md:text-start">{profession}</p>
                </div>
                <p className="mt-2 font-body text-base leading-relaxed tracking-normal text-ink/75 text-center md:text-start w-[80%]">
                    {description}
                </p>
            </div>
            
        </li>
    )
}
