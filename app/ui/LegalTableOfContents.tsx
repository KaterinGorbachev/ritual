// Numbered navigation for a legal document, sticky at both sizes.
//
// Deliberately a Server Component with no JavaScript: plain anchors already give
// keyboard access, browser history, "open in new tab" and in-page search, and a
// native <details> handles the mobile collapse. Nothing here needs state.
//
// ## Two shapes
//
// - **`lg` and up** — an open list in the sticky left column. The stickiness
//   itself lives on the wrapping column in page.tsx (it needs `self-start` to
//   have room to travel); this component only caps its own height.
// - **below `lg`** — a collapsed <details> bar pinned to the top of the
//   viewport. Fourteen expanded links would otherwise push the document a whole
//   screen down on a phone, so it opens on demand and closes out of the way.
//
// `open` is set at `lg` via CSS (`details[open]` cannot be expressed
// responsively in the attribute), so the desktop list is never collapsed.
//
// Hidden when printing: a list of anchors means nothing on paper.

export function LegalTableOfContents({
    sections,
    label,
    heading,
}: {
    sections: { number: number; id: string; heading: string }[];
    /** aria-label for the nav landmark. */
    label: string;
    /** Visible heading, and the summary text of the mobile collapse. */
    heading: string;
}) {
    return (
        <nav
            aria-label={label}
            data-testid="legal-toc"
            className="legal-toc sticky top-2 z-30 w-full lg:top-0 lg:z-auto print:hidden"
        >
            {/* Closed in the markup: on a phone an open list of 13 links would
                fill the screen and leave the sticky bar nothing to pin. CSS
                forces it open again at `lg`, where it is the sidebar. */}
            <details
                className="legal-toc-details group w-full overflow-hidden rounded-card border border-blush/10 bg-cream/95 shadow-sm backdrop-blur-md lg:bg-cream/80 lg:shadow-none"
            >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 font-handwriting text-2xl leading-none text-magenta transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream lg:cursor-default">
                    {heading}
                    <span
                        aria-hidden="true"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-iris/15 text-iris transition duration-500 ease-in-out group-open:rotate-180 lg:hidden"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m5 9 7 7 7-7" />
                        </svg>
                    </span>
                </summary>

                <ol className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto px-5 pb-4 lg:max-h-[calc(100vh-10rem)]">
                    {sections.map((section) => (
                        <li key={section.id}>
                            <a
                                href={`#${section.id}`}
                                className="flex min-h-11 items-baseline gap-2 rounded-pill px-3 py-2 font-body text-sm leading-relaxed text-ink/80 transition duration-500 ease-in-out hover:bg-blush/20 hover:text-magenta focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream"
                            >
                                <span className="shrink-0 font-bold text-iris">
                                    {section.number}.
                                </span>
                                {section.heading}
                            </a>
                        </li>
                    ))}
                </ol>
            </details>
        </nav>
    );
}
