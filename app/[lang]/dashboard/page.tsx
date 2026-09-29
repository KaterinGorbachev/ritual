import { Section } from "../../ui/Section";
import { DashboardPanel } from "../../ui/DashboardPanel";
import { getDictionary, toLocale } from "../dictionaries";




export default async function DashboardPage({ params }: PageProps<"/[lang]/services">) {
    const { lang } = await params;
    const locale = toLocale(lang);
    const dict = await getDictionary(locale);
    const page = dict.servicesPage;
    


    return (
        <Section>

            <div className="flex w-full flex-col items-center justify-center bg-cream/89 rounded-pill mb-8 lg:mb-10 ">
                {/* --- Page header: eyebrow, title, description, then the search bar --- */}
                <header className="flex w-full flex-col items-center gap-3 text-center  py-8 px-4 max-w-3xl">
                    <p className="font-handwriting text-3xl leading-none text-magenta"></p>
                    <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
                        Управление контентом
                    </h1>
                    <button className="font-body font-bold text-base text-mauve tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-mauve text-ink-60 rounded-pill border-2 cursor-pointer active:ring-magenta active:bg-magenta active:scale-95 hover:bg-mauve hover:text-ink">Выйти</button>


                </header>
            </div>
            {/** main page */}
            <DashboardPanel></DashboardPanel>
            

        </Section>
    )
}