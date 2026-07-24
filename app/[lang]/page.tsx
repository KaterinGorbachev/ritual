import { getDictionary, toLocale } from "./dictionaries";
import { BubbleCanvas } from "../ui/BubbleCanvas";
import { WhatsAppButtonWave } from "../ui/WhatsAppButtonWave";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { Section } from "../ui/Section";
import { ServiceCard } from "../ui/ServiceCard";
import { TeamCard } from "../ui/TeamCard";
import { BrandMarquee } from "../ui/BrandMarquee"

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const dict = await getDictionary(toLocale(lang));

  return (
    <Section>
      <div
        data-testid="hero-section"
        className="flex flex-col items-center justify-center w-full max-w-400 relative isolate min-h-165 overflow-hidden lg:rounded-pill lg:relative lg:top-0 px-4 lg:px-32 py-12 lg:py-10 shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.25)] fixed -top-24"
      >
        {/* Client-only canvas: Monet garden + liquid-glass soap bubbles. */}
        <BubbleCanvas heroPauseWord={dict.hero.pauseWord} heroPlayWord={dict.hero.playWord} />

        {/* Hero content sits above the canvas on a frosted panel. */}
        <div className="relative z-1 my-16 rounded-pill bg-cream/55 px-6 py-10 text-center backdrop-blur-md md:px-16 md:py-14 flex flex-col items-center justify-center gap-2 w-full ">
          <p className="font-handwriting text-magenta text-3xl">{dict.hero.eyebrow}</p>
          <h1 className="font-display font-semibold tracking-wider text-[clamp(2.5rem,7vw,3rem)] text-ink">{dict.hero.title}</h1>
          <p className="font-body text-lg md:text-xl text-ink/80 max-w-[80%]">{dict.hero.subtitle}</p>
          <br />
          <WhatsAppButtonWave message={dict.nav.message} >
            <span className="font-body text-lg md:text-xl text-ink">{dict.hero.cta}</span>
          </WhatsAppButtonWave>

        </div>
      </div>
      <div className="max-w-400 py-10 lg:py-18 flex flex-col items-center justify-center  gap-6 lg:gap-12">
        <div className="flex flex-col gap-2 items-center justify-center">
          <p className="font-handwriting text-magenta text-2xl leading-normal text-center">{dict.topServices.eyebrow}</p>
          <h2 className="traking normal text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold text-center">{dict.topServices.title}</h2>
        </div>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 px-2">
          {
            dict.topServices.items.map(item =>
              <ServiceCard key={item.id} title={item.name} description={item.description} image={item.image} />)
          }

          <li className="flex items-start justify-center flex-col py-2 px-4 relative h-full min-h-72 w-full max-w-[350px] overflow-hidden rounded-card border border-blush/20 bg-blush/70 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] ">
            <div className="flex w-full flex-col items-start justify-center py-8 gap-2">
              <h3 className="font-display tracking-normal text-ink text-2xl text-start">{dict.topServices.ctaQuestion}</h3>
              <p className=" text-base leading-relaxed tracking-normal text-ink/85 text-start">{dict.topServices.ctaComment}</p>
            </div>
            <WhatsAppButton message={dict.topServices.message} >
              <span className="font-body text-lg md:text-xl text-ink text-center">{dict.topServices.cta}</span>
            </WhatsAppButton>

          </li>


        </ul>

      </div>
      <div className="py-10 lg:py-18 flex flex-col items-center justify-center gap-6 lg:gap-12 bg-blush/70 min-h-50 w-full  sm:px-4">
        <div className="flex flex-col gap-0.5 items-center justify-center px-4">
          <p className="font-handwriting text-magenta text-2xl leading-normal text-center">{dict.aboutStaff.eyebrow}</p>
          <h2 className="traking normal text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold text-center">{dict.aboutStaff.title}</h2>
        </div>

        <ul className="flex flex-col items-center justify-center gap-4 lg:gap-4 lg:flex-row lg:flex-wrap w-full px-2 ">
          {dict.staff.map((member, i) => (
            <TeamCard 
            key={member.id}
            name={member.name}
            profession={member.service} 
            description={member.description}
            image={member.image}
            className={i % 2 == 1 ? "team-card--from-right" : "team-card--from-left"}/>
            
          ))}
        </ul>

      </div>
      <div className="max-w-400 py-8 lg:py-16 flex flex-col items-start justify-start  gap-6 lg:gap-12 w-full px-4 md:px-8 lg:px-24">
        <div className="flex flex-col gap-2 items-start justify-start w-full">
          <p className="font-handwriting text-magenta text-2xl leading-normal text-start">{dict.aboutCosmetics.eyebrow}</p>
          <h2 className="traking normal text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold text-start ">{dict.aboutCosmetics.title}</h2>
        </div>
        <BrandMarquee items={dict.cosmetics} />
      </div>
    </Section>
  );
}