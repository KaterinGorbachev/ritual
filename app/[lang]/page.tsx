import { getDictionary, toLocale } from "./dictionaries";
import { BubbleCanvas } from "../ui/BubbleCanvas";
import { WhatsAppButtonWave } from "../ui/WhatsAppButtonWave";
import {Section} from "../ui/Section";

export default async function HomePage({ params }: PageProps<"/[lang]"> ) {
  const { lang } = await params;
  const dict = await getDictionary(toLocale(lang));

  return (
    <Section>
      <div
        data-testid="hero-section"
        className="flex flex-col items-center justify-center w-full max-w-400 relative isolate min-h-140 md:min-h-165 overflow-hidden rounded-card px-4 lg:px-32 py-8 lg:py-10 shadow-[0_0_0_1px_rgba(106,13,173,.12),0_18px_50px_-24px_rgba(106,13,173,.45)] "
      >
        {/* Client-only canvas: Monet garden + liquid-glass soap bubbles. */}
        <BubbleCanvas heroPauseWord={dict.hero.pauseWord} heroPlayWord={dict.hero.playWord}/>

        {/* Hero content sits above the canvas on a frosted panel. */}
        <div className="relative z-1 mt-8 rounded-card bg-cream/55 px-6 py-10 text-center backdrop-blur-md md:px-16 md:py-14 flex flex-col items-center justify-center gap-2 w-full ">
          <p className="font-handwriting text-magenta text-3xl">{dict.hero.eyebrow}</p>
          <h1 className="font-display font-semibold tracking-wider text-[clamp(2.5rem,7vw,3rem)] text-ink">{dict.hero.title}</h1>
          <p className="font-body text-lg md:text-xl text-ink/80 max-w-[80%]">{dict.hero.subtitle}</p>
          <br />
          <WhatsAppButtonWave message={dict.nav.message} >
            <span className="font-body text-lg md:text-xl text-ink">{dict.hero.cta}</span>
          </WhatsAppButtonWave>

        </div>
      </div>
      <div className="max-w-400 py-8 lg:py-10 flex flex-col items-center justify-center mt-4">
        <div className="flex flex-col gap-2 items-center justify-center">
          <p className="font-handwriting text-iris text-2xl leading-normal text-center">{dict.topServices.eyebrow}</p>
          <h2 className="traking normal text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold text-center">{dict.topServices.title}</h2>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"></ul>

      </div>
    </Section>
  );
}