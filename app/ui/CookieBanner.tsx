"use client";

// The cookie notice — an *aviso*, not a consent gate.
//
// This site sets no advertising or analytics cookies. The only things stored
// are functional: the `ritual:lang` locale cookie the proxy reads, and the
// `ritual:motion-off` animation preference. Under ePrivacy/LOPDGDD those are
// strictly necessary and need no prior consent, so the correct control is an
// informational notice the visitor can dismiss — never a blocking modal that
// holds the page hostage until someone clicks "accept".
//
// Everything here follows from that:
//   * `role="complementary"`, not `<dialog>` — no focus trap, no inert page,
//     nothing to escape from. The visitor can ignore it and keep browsing.
//   * the fixed wrapper is `pointer-events-none` so only the card itself
//     catches clicks; the page underneath stays fully operable.
//   * focus is never stolen on mount — a keyboard user stays where they were.
//
// The acknowledgement lives in the `cookieStore` Zustand store (persisted to
// localStorage, not to a cookie — a notice about data minimisation should not
// itself set a new cookie to remember that it was read).
import { useEffect } from "react";
import { GostButton } from "./GostButton";
import { useCookieNoticeStore } from "../store/cookieStore";

export { COOKIE_NOTICE_KEY } from "../store/cookieStore";

export type CookieBannerLabels = {
  /** Heading — also the accessible name of the region, e.g. "About cookies". */
  title: string;
  /** The full explanation of what is stored and why, already localised. */
  message: string;
  /** Text of the link through to the privacy policy. */
  policyLink: string;
  /** Dismiss button, e.g. "Got it". */
  accept: string;
  /** aria-label for the icon-only close control. */
  close: string;
};

type CookieBannerProps = {
  labels: CookieBannerLabels;
  /** Locale-prefixed path to the privacy policy, e.g. `/es/privacy`. */
  privacyHref: string;
};

export function CookieBanner({ labels, privacyHref }: CookieBannerProps) {
  const acknowledged = useCookieNoticeStore((s) => s.acknowledged);
  const hydrated = useCookieNoticeStore((s) => s.hydrated);
  const acknowledge = useCookieNoticeStore((s) => s.acknowledge);

  // The store is created with `skipHydration`, so the server render and the
  // first client paint agree (notice hidden); this pulls the stored value in
  // afterwards. Rehydrating is a store action rather than a component
  // setState, so it costs one render instead of a cascading one.
  useEffect(() => {
    useCookieNoticeStore.persist.rehydrate();
  }, []);

  // Hidden until the stored answer is known, so a returning visitor never sees
  // the notice flash before rehydration hides it again.
  if (!hydrated || acknowledged) return null;

  return (
    // Pinned to the bottom-left corner, above everything else on the page (the
    // sticky header sits at z-40). pointer-events-none on the positioner, auto
    // on the card: the strip spans the viewport for layout, but only the card
    // is clickable, so the notice never swallows a tap meant for the page
    // behind it.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-start p-4">
      <aside
        role="complementary"
        aria-label={labels.title}
        data-testid="cookie-banner"
        className="pointer-events-auto flex w-full max-w-md flex-col gap-4 rounded-card border border-blush/10 bg-cream/95 p-4 shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.25)] backdrop-blur-md sm:p-5"
      >
        <div className="flex items-start gap-4">
          {/* Sketched cookie in a circle — decorative; the heading and copy
              carry the meaning, so nothing rests on the glyph alone. */}
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush/30 text-iris"
            data-testid="cookie-banner-icon"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="9.5" cy="9.5" r="1" />
              <circle cx="14.5" cy="13" r="1" />
              <circle cx="10" cy="15" r="1" />
            </svg>
          </span>

          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold text-ink">
              {labels.title}
            </h2>
            <p className="font-body text-sm leading-relaxed text-ink/75">
              {labels.message}{" "}
              <a
                href={privacyHref}
                className="rounded-pill text-iris underline transition duration-500 ease-in-out hover:text-magenta hover:no-underline focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream"
                data-testid="cookie-banner-policy-link"
              >
                {labels.policyLink}
              </a>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <GostButton
            type="button"
            variant="solid"
            onClick={acknowledge}
            data-testid="cookie-banner-accept"
            className="box-border inline-flex min-h-11 min-w-11 items-center justify-center border-2 border-transparent px-6 py-3 font-bold tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95"
          >
            {labels.accept}
          </GostButton>

          <GostButton
            type="button"
            onClick={acknowledge}
            aria-label={labels.close}
            title={labels.close}
            data-testid="cookie-banner-close"
            className="box-border inline-flex min-h-11 min-w-11 items-center justify-center border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </GostButton>
        </div>
      </aside>
    </div>
  );
}
