import { LegalTable, type LegalTableData } from "./LegalTable";

// One numbered section of a legal document.
//
// ## Everything is visible. Nothing collapses.
//
// An earlier version put the body inside a <details>. That was wrong: a privacy
// policy exists to be READ, and text behind a disclosure triangle is text most
// people never see — which defeats the art. 12.1 duty to inform "in a concise,
// transparent, intelligible and easily accessible form". Hiding the substance
// also breaks Ctrl+F, deep links into a subsection, and anyone skimming for the
// one clause they care about.
//
// The layering that Legal Design (and the AEPD's privacy-by-design guide) asks
// for is therefore done with TYPOGRAPHY, not with visibility: the one-sentence
// `summary` is set larger in a tinted lead-in box so a skimmer can read just the
// summaries, and the full text follows immediately underneath at body size. Both
// are always on screen.
//
// The section number lives in the DATA, not in a CSS counter, because clients
// and the salon cite sections by number ("see §7") and that reference has to
// mean the same thing in all three languages — and has to be copied along with
// the heading, and read out by a screen reader.

export type LegalSectionData = {
  number: number;
  id: string;
  icon: string;
  heading: string;
  summary: string;
  body: string[];
  list?: { term: string; detail: string }[];
  table?: LegalTableData;
  note?: string;
};

/**
 * Decorative section icons — sketchy, 1px stroke, `currentColor`, per DESIGN.md.
 * An unknown key renders nothing rather than throwing, so adding a section to
 * the dictionaries can never break the page.
 */
const ICONS: Record<string, React.ReactNode> = {
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c.6-3.7 3.3-5.5 6.5-5.5s5.9 1.8 6.5 5.5" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h6.5L18 8v12.5H7z" />
      <path d="M13 3.5V8h5" />
      <path d="M9.5 12.5h6M9.5 16h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.3l3.2 2" />
    </>
  ),
  hand: (
    <>
      <path d="M9 11V5.8a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M11.8 10.6V4.9a1.4 1.4 0 0 1 2.8 0v5.7" />
      <path d="M14.6 11V6.8a1.4 1.4 0 0 1 2.8 0v7.6c0 3.4-2.2 5.9-5.4 5.9-3 0-4.6-1.6-5.7-4L5 13.4a1.4 1.4 0 0 1 2.3-1.6L9 13.8" />
    </>
  ),
  share: (
    <>
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17" cy="6.5" r="2.5" />
      <circle cx="17" cy="17.5" r="2.5" />
      <path d="M8.8 10.8 14.8 7.7M8.8 13.2l6 3.1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.3 5.4 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.4-3.3-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
  chat: (
    <>
      <path d="M20 11.5c0 3.9-3.6 7-8 7-1 0-2-.2-2.9-.5L4.5 19.5l1.2-3.3A6.6 6.6 0 0 1 4 11.5c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
    </>
  ),
  cookie: (
    <>
      <path d="M20.4 12.3A8.5 8.5 0 1 1 11.6 3.6a3.2 3.2 0 0 0 4.2 4 3.2 3.2 0 0 0 4.6 4.7Z" />
      <path d="M9.5 10.2h.01M13 14.5h.01M8.8 15.4h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M12 14v2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
      <path d="m4.5 8 7.5 5.2L19.5 8" />
    </>
  ),
};

function SectionIcon({ name }: { name: string }) {
  const glyph = ICONS[name];
  if (!glyph) return null;

  return (
    // Circle container for every icon, per DESIGN.md.
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush/20 text-iris"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </svg>
    </span>
  );
}

export function LegalSection({
  section,
}: {
  section: LegalSectionData;
}) {
  const headingId = `${section.id}-heading`;
  const numberedHeading = `${section.number}. ${section.heading}`;

  return (
    <section
      id={section.id}
      aria-labelledby={headingId}
      data-testid={`legal-section-${section.id}`}
      // Keeps the sticky header off the heading you just jumped to.
      className="flex w-full scroll-mt-28 flex-col gap-4 border-b border-blush/10 pb-10 last:border-b-0"
    >
      <div className="flex items-start gap-4">
        <h2
          id={headingId}
          className="font-display text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-wider text-ink"
        >
          {/* The number is text inside the heading, so it is copied
                        with it and announced by a screen reader. */}
          <span className="text-magenta">{section.number}.</span>{" "}
          {section.heading}
        </h2>
      </div>

      {/* The lead-in: the same one sentence as before, but now an
                introduction to the text below rather than a stand-in for it. */}
      <div className="flex flex-col gap-2 rounded-card border border-blush/10 bg-blush/15 p-5">
        
        <div className="flex gap-2 items-center justify-start">
          <SectionIcon name={section.icon} />
          <p className="max-w-prose font-body text-lg leading-relaxed text-ink/80">
            {section.summary}
          </p>
        </div>
      </div>

      {/* The full text — always visible, never behind a control. */}
      <div
        data-testid={`legal-body-${section.id}`}
        className="flex flex-col gap-5"
      >
        {section.body.map((paragraph, index) => (
          <p
            key={index}
            className="max-w-prose font-body text-base leading-relaxed text-ink/80"
          >
            {paragraph}
          </p>
        ))}

        {section.list ? (
          <dl className="flex flex-col gap-4">
            {section.list.map((item, index) => (
              <div
                key={item.term}
                className="flex flex-col gap-1 border-l-2 border-blush/40 pl-4"
              >
                <dt className="flex items-baseline gap-2 font-body font-bold text-ink">
                  {/* Sub-points are numbered by the
                                        component, never hand-typed into
                                        the translated strings. */}
                  <span className="font-body text-sm text-magenta">
                    {section.number}.{index + 1}
                  </span>
                  {item.term}
                </dt>
                <dd className="max-w-prose font-body text-base leading-relaxed text-ink/75">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {section.table ? (
          <LegalTable table={section.table} caption={numberedHeading} />
        ) : null}

        {section.note ? (
          <p className="max-w-prose rounded-card border border-mint/40 bg-mint/10 p-4 font-body text-base leading-relaxed text-ink/80">
            {section.note}
          </p>
        ) : null}
      </div>
    </section>
  );
}
