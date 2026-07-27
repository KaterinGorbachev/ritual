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
      className={`sticky top-16 self-end grid place-items-center w-11 h-11 shadow-sm ${className}`}
    >
      {off ? (
        // Play triangle — resume animations.
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        // Stop square — stop animations.
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      )}
    </GostButton>
  );
}
