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
    // Mobile only: the bio panel slides in over the image when the card is open.
    const [open, setOpen] = useState(false);

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
        <li ref={ref} data-testid="team-card" className={`relative isolate flex-col md:flex-row flex items-stretch justify-between gap-4 p-2 min-h-72 w-full  rounded-card overflow-hidden border border-blush/10 bg-cream/80 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] team-card ${inView ? "team-card--in-view" : ""} ${className}`}>
            <div className="relative w-full shrink-0 overflow-hidden rounded-card md:max-w-[250px] shadow-xs h-[360px] md:h-auto md:max-h-full">
                <img src={image} alt={name} className="w-full h-full object-cover object-center" />
            </div>
            <div className={`absolute inset-0 z-10 flex flex-col bg-cream transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] ${open ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"} md:static md:inset-auto md:z-auto md:translate-x-0 md:opacity-100 md:pointer-events-auto md:bg-transparent md:flex w-full items-start justify-start py-6 px-4 gap-2 md:pr-2 md:px-0`}>
                <div>
                    <h3 className="font-display text-2xl tracking-normal text-ink text-start">{name}</h3>
                    <p className="mt-2 font-body text-sm leading-relaxed tracking-normal text-iris/75 text-start">{profession}</p>
                </div>
                <p className="mt-2 font-body text-base leading-relaxed tracking-normal text-ink/75 pr-4">
                    {description}
                </p>
            </div>
            <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-center justify-start gap-2 w-full md:hidden text-start group hover:gap-10">
                <div className="flex items-start flex-col justify-start gap-2 max-w-[70%]">
                    <h3 className="font-display text-2xl tracking-normal text-ink text-start">{name}</h3>
                    <p className="mt-2 font-body text-sm leading-relaxed tracking-normal text-iris/75 text-start">{profession}</p>
                </div>
                <svg
                    className={`shrink-0 text-magenta transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="m9 6 6 6-6 6" />
                </svg>
            </button>
        </li>
    )
}
