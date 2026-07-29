import { VideoFrame } from "./VideoFrame";
import { WhatsAppButton } from "./WhatsAppButton";

type FilmSectionProps = {
  /** Caveat eyebrow above the section heading, localised. */
  eyebrow: string;
  /** The section <h2>, localised. */
  title: string;
  /** Section lead / description, localised. */
  description: string;
  /** Everything the film frame needs (all localised where user-visible). */
  video: {
    /** Video file under /public. */
    src: string;
    /** Poster image under /public. */
    poster: string;
    /** Film title — poster alt text. */
    title: string;
    /** Accessible name for the play control. */
    playLabel: string;
    /** Optional MIME type; defaults to mp4 inside VideoFrame. */
    type?: string;
  };
  /** The right-side marketing/booking card copy, localised. */
  card: {
    /** Small Caveat eyebrow on the card. */
    eyebrow: string;
    /** Card heading, e.g. "Discover Ritual for you". */
    heading: string;
    /** Marketing lead line. */
    lead: string;
    /** WhatsApp CTA label, e.g. "Contact us". */
    cta: string;
  };
  /** Prefilled WhatsApp message for the CTA, localised. */
  message: string;
  className?: string;
};

/**
 * The "film" band: a vertical, Instagram-format film frame beside a marketing
 * card that invites booking on WhatsApp. Presentational Server Component — all
 * copy arrives localised as props; the only client piece is the <VideoFrame>
 * (it owns the click-to-play state and the DOM <video>).
 *
 * Layout: single column on mobile (card under the film), two columns from `lg`
 * with the film on the left and the card on the right, both vertically centred.
 */
export function FilmSection({
  eyebrow,
  title,
  description,
  video,
  card,
  message,
  className = "",
}: FilmSectionProps) {
  return (
    <div
      data-testid="film-section"
      className={`flex w-full max-w-400 flex-col items-center justify-center gap-6 py-10 lg:gap-12 lg:py-18 ${className}`}
    >
      {/* Section opener: Caveat eyebrow + heading + lead. */}
      <div className="flex max-w-2xl flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-handwriting text-2xl leading-normal text-magenta">{eyebrow}</p>
        <h2 className="text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold tracking-normal">
          {title}
        </h2>
        <p className="mt-1 font-body text-base leading-relaxed text-ink/75">{description}</p>
      </div>

      {/* Film + card. Film leads on the left from lg; the card sits beside it. */}
      <div className="flex w-full flex-col items-center justify-center gap-8 px-4 md:px-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-24">
        <VideoFrame
          src={video.src}
          poster={video.poster}
          title={video.title}
          playLabel={video.playLabel}
          type={video.type}
          className="lg:shrink-0"
        />

        {/* Marketing / booking card. */}
        <div className="flex w-full max-w-md flex-col items-start justify-center gap-4 rounded-card border border-blush/10 bg-cream/80 p-6 text-start md:p-8">
          <p className="font-handwriting text-2xl leading-normal text-magenta">{card.eyebrow}</p>
          <h3 className="font-display text-2xl tracking-normal text-ink">{card.heading}</h3>
          <p className="font-body text-base leading-relaxed text-ink/80">{card.lead}</p>
          <WhatsAppButton message={message} className="mt-2 w-full sm:w-auto">
            <span className="font-body text-lg text-ink">{card.cta}</span>
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
