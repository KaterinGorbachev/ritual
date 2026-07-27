"use client";

// The interactive heart of the Services & Prices page: a search field that
// filters three category price containers (Face / Body / Nails) live. It is a
// client component because the filtering is stateful; per the project boundary
// rule it never imports a dictionary — every visible string arrives as a prop,
// already translated by the server page.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type PriceItem = {
  id: string;
  name: string;
  /** e.g. "60 min" — already localised by the caller. */
  duration: string;
  /** Formatted price string, e.g. "€65". */
  price: string;
};

export type ServiceCategory = {
  id: string;
  /** Category heading, e.g. "Face". */
  title: string;
  /** One-line description of the category. */
  blurb: string;
  items: PriceItem[];
};

type ServicePriceListProps = {
  categories: ServiceCategory[];
  /** Page header content, rendered above the search bar. */
  eyebrow: string;
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  /** Shown inside a category when the query matches nothing there. */
  emptyText: string;
  /** Shown when the query matches nothing in any category. */
  noResultsText: string;
  /** Screen-reader duration prefix, e.g. "Duration". */
  durationLabel: string;
};

export function ServicePriceList({
  categories,
  eyebrow,
  title,
  description,
  searchLabel,
  searchPlaceholder,
  emptyText,
  noResultsText,
  durationLabel,
}: ServicePriceListProps) {
  const [query, setQuery] = useState("");
  // The first category (Face) is active by default; scrolling and clicks move it.
  const [activeId, setActiveId] = useState<string>(() => categories[0]?.id ?? "");
  const searchId = useId();
  const statusId = useId();

  // One ref per category section, so a filter click can scroll it into view
  // and the scroll-spy observer can watch each one.
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  // While a click-scroll is animating, suppress the observer so it doesn't
  // flip the active button through the sections it passes over en route.
  const clickScrolling = useRef(false);

  const q = query.trim().toLocaleLowerCase();

  // Clicking a filter marks it active and scrolls its price container into
  // view. `scroll-mt-*` on the section keeps it clear of the sticky filter
  // bar; smooth scroll is dropped for reduced-motion users.
  const handleFilter = useCallback((id: string) => {
    setActiveId(id);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    clickScrolling.current = true;
    sectionRefs.current[id]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    // Re-enable the scroll-spy once the smooth scroll has settled.
    window.setTimeout(() => {
      clickScrolling.current = false;
    }, reduced ? 0 : 700);
  }, []);

  // Scroll-spy: highlight the filter for whichever category section is
  // currently topmost in the viewport, updating as the reader scrolls either
  // way. `rootMargin` biases the trigger line to just under the sticky filter
  // bar so a section counts as "active" as its heading reaches that line.
  useEffect(() => {
    const sections = categories
      .map((c) => sectionRefs.current[c.id])
      .filter((el): el is HTMLElement => el != null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return;
        // The trigger line sits ~112px below the viewport top (under the sticky bar).
        const triggerLine = 300;
        // Re-scan every section (not just the changed entries): pick the last
        // section whose top has passed the trigger line — that's the one the
        // reader is currently in, whether scrolling down or up.
        let currentId: string | null = null;
        for (const c of categories) {
          const el = sectionRefs.current[c.id];
          if (!el) continue;
          if (el.getBoundingClientRect().top <= triggerLine) {
            currentId = c.id;
          }
        }
        // Before the first section reaches the line, keep the first active.
        if (currentId) setActiveId(currentId);
      },
      // Trigger band sits ~112px from the top (under the sticky bar), 60% up
      // from the bottom — so the topmost section in the upper viewport wins.
      // (rootMargin only accepts px/%, not rem.)
      { rootMargin: "-112px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  // Filter each category's items by name; keep every category visible so the
  // three-column layout (and the bubbles peeking between them) stays stable.
  const filtered = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        items: q ? c.items.filter((i) => i.name.toLocaleLowerCase().includes(q)) : c.items,
      })),
    [categories, q],
  );

  const totalMatches = filtered.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="flex w-full flex-col items-center gap-10 lg:gap-14 isolate relative">
      {/* Sticky control bar. Stacks on mobile (search full-width, filters
          below); becomes a row from md up. `top-24` clears the sticky header
          (top-2) and `z-30` sits below it (header is z-40). */}
      <div className="flex w-full max-w-[1600px] flex-col gap-4 md:flex-row md:items-end md:justify-between bg-blush/65 rounded-pill px-4 py-3 sticky z-30 top-10">
        {/* --- Search --- */}
        <div className="flex w-full flex-col md:max-w-xl md:min-w-50">
          <label htmlFor={searchId} className="mb-2 block text-start font-handwriting text-xl text-iris/90">
            {searchLabel}
          </label>
          <div className="group relative flex items-center rounded-pill border border-mauve/40 bg-cream/85 shadow-sm backdrop-blur-md transition focus-within:border-blush/10 focus-within:ring-offset-2 focus-within:ring-offset-cream focus-within:ring-mint focus-within:ring-2 w-full">
          {/* Decorative magnifier in the circle the design system asks for */}
          <span
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush/40 text-iris"
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <input
            id={searchId}
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-describedby={statusId}
            className="min-h-11 w-full bg-transparent px-3 py-2 font-body text-base text-ink placeholder:text-ink/45 focus:placeholder:text-transparent focus:outline-none"
          />
          </div>
          {/* Live count for assistive tech; also visible when nothing matches. */}
          <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={`mt-3 text-center font-body text-sm ${totalMatches === 0 && q ? "text-magenta" : "sr-only"}`}
        >
          {totalMatches === 0 && q ? noResultsText : ""}
          </p>
        </div>
        {/* --- Filters --- */}
        {/* Wraps under the search on mobile; a right-aligned row from md up.
            Each button scrolls to its category and stays highlighted while
            active (aria-pressed exposes that state to assistive tech). */}
        <div className="flex flex-wrap gap-3 md:justify-end md:gap-4 ">
          {filtered.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleFilter(cat.id)}
                aria-pressed={isActive}
                className={`cursor-pointer rounded-pill py-3 px-4 shadow-sm font-display text-sm font-semibold border-2 transition hover:border-magenta focus-visible:border-mint focus-visible:outline-none ${
                  isActive
                    ? "border-mauve/40 bg-cream/85 text-ink/85" 
                    : "border-iris/10 bg-lilac/5 text-iris"
                }`}
              >
                {cat.title}
              </button>
            );
          })}
        </div>
      </div>
      

      {/* --- Three category containers --- */}
      {/* items-start (not stretch) + generous gaps leave open space between the
          frosted panels, so the fixed bubble field behind shows through them. */}
      <ul className="grid w-full max-w-400 grid-cols-1 items-start gap-8 lg:grid-cols-3 lg:gap-10">
        {filtered.map((cat) => (
          <li key={cat.id}>
            <section
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              data-cat-id={cat.id}
              aria-labelledby={`${cat.id}-title`}
              className="flex h-full flex-col gap-5 rounded-card border border-blush/20 bg-cream/80 p-6 shadow-sm backdrop-blur-md scroll-mt-46 lg:p-8"
            >
              <header className="flex flex-col gap-1">
                <h2
                  id={`${cat.id}-title`}
                  className="font-display text-2xl font-semibold tracking-normal text-ink"
                >
                  {cat.title}
                </h2>
                <p className="font-body text-sm leading-relaxed text-ink/70">{cat.blurb}</p>
              </header>

              {cat.items.length === 0 ? (
                <p className="py-6 text-center font-body text-sm text-ink/60">{emptyText}</p>
              ) : (
                <dl className="flex flex-col">
                  {cat.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-baseline justify-between gap-4 py-3 ${
                        idx > 0 ? "border-t border-mauve/25" : ""
                      }`}
                    >
                      <div className="flex min-w-0 flex-col">
                        <dt className="font-body text-base text-ink">{item.name}</dt>
                        <dd className="font-body text-sm text-ink/60">
                          <span className="sr-only">{durationLabel}: </span>
                          {item.duration}
                        </dd>
                      </div>
                      <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-iris">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </li>
        ))}
      </ul>
    </div>
  );
}
