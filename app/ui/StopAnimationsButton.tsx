"use client";

// The single global animation control. Reads the shared motion flag and flips
// it; every animator on the page (canvases + CSS) obeys that flag, so this one
// button stops and resumes all motion. Styled like the salon's other pill
// actions (GostButton). It shows a stop / play icon; the words are kept as the
// accessible name (aria-label + title) so an icon-only control still meets
// WCAG AA.
import { GostButton } from "./GostButton";
import { useMotion } from "./MotionContext";

type StopAnimationsButtonProps = {
  /** Accessible label while animation runs — clicking it stops everything. */
  stopWord: string;
  /** Accessible label while animation is stopped — clicking it resumes it. */
  resumeWord: string;
  className?: string;
  style?: React.CSSProperties;
};

export function StopAnimationsButton({
  stopWord,
  resumeWord,
  className = "",
  style,
}: StopAnimationsButtonProps) {
  const { off, toggle } = useMotion();
  const label = off ? resumeWord : stopWord;

  return (
    <GostButton
      type="button"
      onClick={toggle}
      aria-pressed={off}
      aria-label={label}
      title={label}
      style={style}
      data-testid="stop-animations-toggle"
      // `border-2 border-transparent` + `box-border` reserve the 2px ring that
      // GostButton's `hover:border-2` would otherwise add on hover, so the icon
      // and label stay put instead of shifting under the cursor.
      className={`sticky top-16 box-border flex items-center justify-center border-2 border-transparent min-w-11 h-11 px-2 shadow-sm ${className}`}
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {off ? (
          // Play triangle — resume animations.
          <path d="M8 5v14l11-7z" />
        ) : (
          // Stop square — stop animations.
          <rect x="6" y="6" width="12" height="12" rx="2" />
        )}
      </svg>
      {/* Both words are stacked in one grid cell, so the label box is always as
          wide as the longer of the two and the button keeps its width when the
          state flips. Only the active word is visible; the other one holds the
          space with `invisible` (still laid out, but hidden from AT — the
          accessible name comes from aria-label anyway). */}
      <span className="font-handwriting text-base text-iris/89 hidden md:grid">
        <span
          className={`col-start-1 row-start-1 ${off ? "" : "invisible"}`}
          aria-hidden={!off}
        >
          {resumeWord}
        </span>
        <span
          className={`col-start-1 row-start-1 ${off ? "invisible" : ""}`}
          aria-hidden={off}
        >
          {stopWord}
        </span>
      </span>
    </GostButton>
  );
}
