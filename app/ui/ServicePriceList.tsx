"use client";

// The interactive heart of the Services & Prices page: a search field that
// filters three category price containers (Face / Body / Nails) live. It is a
// client component because the filtering is stateful; per the project boundary
// rule it never imports a dictionary — every visible string arrives as a prop,
// already translated by the server page.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ServiceItemCard } from "./ServiceItemCard";
import { serviceCategoryIcon } from "./serviceCategoryIcons";

export type PriceItem = {
  id: string;
  name: string;
  /** One-line description of the treatment, already localised. */
  description: string;
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
  from: string;
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
  /** Booking button label on each card, e.g. "Book on WhatsApp". */
  bookLabel: string;
  /** Message template with a `{service}` slot, prefilled into the wa.me link. */
  bookMessage: string;
};

export function ServicePriceList({
  categories,
  from,
  eyebrow,
  title,
  description,
  searchLabel,
  searchPlaceholder,
  emptyText,
  noResultsText,
  durationLabel,
  bookLabel,
  bookMessage,
}: ServicePriceListProps) {
  const [query, setQuery] = useState("");
  // Each card gets a WhatsApp booking message naming its own service; the
  // <WhatsAppButton> inside the card reads the salon number from the store and
  // builds the wa.me link itself.
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
    <div className="flex w-full flex-col items-center gap-10 lg:gap-14 isolate relative max-w-400">
      {/* Sticky control bar. Stacks on mobile (search full-width, filters
          below); becomes a row from md up. `top-24` clears the sticky header
          (top-2) and `z-30` sits below it (header is z-40). */}
      <div className="flex w-full  flex-col gap-4  items-center  sticky z-30 top-20">
        
        {/* --- Filters --- */}
        {/* Wraps under the search on mobile; a right-aligned row from md up.
            Each button scrolls to its category and stays highlighted while
            active (aria-pressed exposes that state to assistive tech). */}
        <div className="flex flex-wrap gap-3 justify-between items-center md:gap-4 w-full max-w-[320px] px-2 py-1 bg-cream/90 rounded-pill shadow-sm">
          {filtered.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleFilter(cat.id)}
                aria-pressed={isActive}
                className={`cursor-pointer rounded-pill py-2 px-4  font-display text-sm font-semibold border-2 transition hover:border-magenta focus-visible:border-mint focus-visible:outline-none ${
                  isActive
                    ? " border-mauve/40 bg-cream text-magenta/89 shadow-sm" 
                    : " bg-cream text-ink/85 border-blush/10"
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

      <ul className="flex flex-col items-start justify-center gap-8 lg:gap-10 w-full ">
        {filtered.map((cat, index) => (
          <li key={cat.id}>
            <section
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              data-cat-id={cat.id}
              aria-labelledby={`${cat.id}-title`}
              className="flex w-full flex-col gap-6 scroll-mt-46 p-4 rounded-pill"
              style={{
                backgroundColor: `color-mix(in oklab, var(--color-blush) ${Math.min((index + index + 1) * 10, 100)}%, transparent)`,
              }}
            >
              <header className="flex items-center gap-3">
                {/* Category glyph in its mandated circle. Decorative (the
                    heading carries the meaning), so the SVG is aria-hidden and
                    the circle takes iris colour via currentColor. */}
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-blush/10 bg-cream "
                >
                  {serviceCategoryIcon(cat.id)}
                </span>
                <div className="flex flex-col gap-1">
                  <h2
                    id={`${cat.id}-title`}
                    className="font-display text-2xl font-semibold tracking-normal text-ink"
                  >
                    {cat.title}
                  </h2>
                  <p className="font-body text-sm leading-relaxed text-ink/70">{cat.blurb}</p>
                </div>
              </header>

              {cat.items.length === 0 ? (
                <p className="py-6 text-center font-body text-sm text-ink/60">{emptyText}</p>
              ) : (
                // A card per service — icon, name, description, duration/price,
                // and a WhatsApp Book button whose message names the service.
                // Reflows 3→2→1 as the viewport narrows, per the layout rules.
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.items.map((item) => (
                    <ServiceItemCard
                      key={item.id}
                      name={item.name}
                      description={item.description}
                      duration={item.duration}
                      from={from}
                      price={item.price}
                      durationLabel={durationLabel}
                      bookLabel={bookLabel}
                      bookMessage={bookMessage.replace("{service}", item.name)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </li>
        ))}
      </ul>
    </div>
  );
}
