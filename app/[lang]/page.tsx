import { getDictionary, toLocale } from "./dictionaries";
import { BubbleCanvas } from "../ui/BubbleCanvas";

export default async function HomePage({ params }: PageProps<"/[lang]"> ) {
  const { lang } = await params;
  const dict = await getDictionary(toLocale(lang));

  return (
    <section className="flex flex-col items-center justify-center w-full py-12 lg:pt-12 lg:pb-16 gap-4 lg:gap-10">
      <div
        data-testid="hero-section"
        className="flex flex-col items-center justify-center w-full max-w-400 relative isolate min-h-140 md:min-h-165 overflow-hidden rounded-card"
      >
        {/* Client-only canvas: Monet garden + liquid-glass soap bubbles. */}
        <BubbleCanvas />

        {/* Hero content sits above the canvas on a frosted panel. */}
        <div className="relative z-1 m-4 max-w-2xl rounded-card bg-cream/55 px-6 py-10 text-center backdrop-blur-md md:px-12 md:py-14">
          <h1 className="font-display font-semibold">{dict.nav.about}</h1>
        </div>
      </div>
    </section>
  );
}