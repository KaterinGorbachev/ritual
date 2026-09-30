import { Section } from "../../ui/Section"; 



export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard">) {

    return (

        <Section>
            <div className="flex w-full flex-col items-center justify-center bg-cream/89 rounded-pill mb-8 lg:mb-10 ">
                {/* --- Page header: eyebrow, title, description, then the search bar --- */}
                <header className="flex w-full flex-col items-center gap-3 text-center  py-8 px-4 max-w-3xl">
                    <p className="font-handwriting text-3xl leading-none text-magenta"></p>
                    <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
                        Управление контентом
                    </h1>
                    <h2>Вход</h2>                    

                </header>
                <main>
                    <form action="">
                        <div>
                            
                        </div>
                    </form>
                </main>
            </div>
            
        </Section>
    )
}