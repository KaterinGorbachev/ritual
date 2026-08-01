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
      className={`flex w-full max-w-270 flex-col items-center justify-center md:flex-row md:items-end  gap-12 md:gap-4 pt-10 md:py-12 lg:gap-2 lg:py-18 ${className}`}
    >


      {/* Film + card. Film leads on the left from lg; the card sits beside it. */}
      <div className="flex w-full flex-col items-start justify-start gap-4 px-4 ">
        {/* Section opener: Caveat eyebrow + heading + lead. */}
        <div className="flex max-w-2xl flex-col items-start justify-start gap-2 text-center">
          <p className="font-handwriting text-2xl leading-normal text-magenta text-start">{eyebrow}</p>
          <h2 className="text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold tracking-normal text-start">
            {title}
          </h2>
          
        </div>
        <VideoFrame
          src={video.src}
          poster={video.poster}
          title={video.title}
          playLabel={video.playLabel}
          type={video.type}
          className="lg:shrink-0"
        />


      </div>

      {/* Marketing / booking card. */}
      <div className="flex w-full md:max-w-md flex-col items-start justify-center gap-4 md:rounded-card border border-blush/10 bg-blush/60 p-6 text-start md:p-8 shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.25)]">
        <p className="font-handwriting text-2xl leading-normal text-magenta">{card.eyebrow}</p>
        <h3 className="font-display text-2xl tracking-normal text-ink">{card.heading}</h3>
        <p className="font-body text-base leading-relaxed text-ink/80">{card.lead}</p>
        <WhatsAppButton message={message} className="mt-2 w-full sm:w-auto">
          <span className="font-body text-lg text-ink">{card.cta}</span>
        </WhatsAppButton>
      </div>
    </div>
  );
}
