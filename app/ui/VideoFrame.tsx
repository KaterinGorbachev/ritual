"use client";

// A vertical, Instagram-format (9:16) film frame for the marketing page.
//
// Performance-first, no autoplay: at rest we render ONLY a lightweight poster
// image (WebP) with a play button — no <video> element exists yet, so nothing
// is fetched. When the user presses play we mount a native <video controls>
// with `preload="none"` and `playsInline`, then start playback. This keeps the
// first paint cheap (one image), respects users who never watch, and behaves
// well on iOS (stays inline in the frame instead of forcing fullscreen).
//
// All copy arrives localised as props — the component never imports the
// dictionaries (it is a client component behind the server/client boundary).
import { useRef, useState } from "react";

type VideoFrameProps = {
  /** Video file under /public, e.g. "/film/ritual.mp4". */
  src: string;
  /** Poster image under /public shown before (and behind) the video. */
  poster: string;
  /** Accessible name for the play control, already localised. */
  playLabel: string;
  /** Film title — used as the poster's alt text, already localised. */
  title: string;
  /** MIME type for the <source>; defaults to mp4. */
  type?: string;
  className?: string;
};

export function VideoFrame({
  src,
  poster,
  playLabel,
  title,
  type = "video/mp4",
  className = "",
}: VideoFrameProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mount the <video>, then start it. Playback is always user-initiated, so no
  // autoplay attribute is ever set; we call play() imperatively after the
  // element exists so preload="none" still means "nothing before the click".
  function start() {
    setPlaying(true);
    // Defer to the next frame so the freshly-mounted <video> is in the DOM.
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {
        /* Autoplay policies won't block a user gesture; ignore any late reject. */
      });
    });
  }

  return (
    <div
      data-testid="video-frame"
      className={`relative isolate aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-card border border-blush/10 bg-cream/80  ${className}`}
    >
      {playing ? (
        <video
          ref={videoRef}
          controls
          playsInline
          preload="none"
          poster={poster}
          className="absolute inset-0 h-full w-full bg-ink/90 object-cover"
        >
          <source src={src} type={type} />
        </video>
      ) : (
        <>
          {/* Cheap first paint: just the poster. No <video> in the DOM yet. */}
          <img
            data-testid="video-frame-poster"
            src={poster}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Soft cream-to-ink veil so the mint play control keeps contrast. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent"
          />
          <button
            type="button"
            onClick={start}
            aria-label={playLabel}
            data-testid="video-frame-play"
            className="group absolute inset-0 grid min-h-11 min-w-11 cursor-pointer place-items-center transition duration-500 ease-in-out focus:outline-none"
          >
            {/* Circle container for the play glyph — the site's icon rule. */}
            <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-transparent bg-cream/85 text-iris shadow-sm backdrop-blur transition duration-500 ease-in-out group-hover:border-magenta group-hover:text-magenta group-focus-visible:border-mint group-active:scale-95">
              <svg
                data-testid="video-frame-play-icon"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                {/* Nudged right so the triangle reads centred in the circle. */}
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </>
      )}
    </div>
  );
}
