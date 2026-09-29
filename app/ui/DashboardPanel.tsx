"use client";
import { useState } from "react";
import { TextArea } from "./TextArea";
import { NumberInput } from "./NumberInput";

type Menu = "add" | "change" | "delete";
/** The three locales every service text must be entered in. */
const LANGUAGES = [
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
] as const;

export function DashboardPanel() {
    const [selected, setSelected] = useState<Menu>("add");

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-16 justify-between w-full min-h-screen items-start max-w-[1024px] px-4">
            <div className="flex lg:flex-col flex-row gap-2">
                <button type="button" name="addService" onClick={() => setSelected("add")} className={`font-body font-bold text-base tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush text-ink-60 rounded-pill border-2 cursor-pointer active:ring-blush active:bg-blush active:scale-95 hover:bg-blush/50  disabled:bg-mauve disabled:text-mauve ${selected === "add" ? 'bg-blush' : 'bg-transparent'}`}>Добавить</button>
                <button type="button" name="changeService" onClick={() => setSelected("change")} className="font-body font-bold text-base tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush text-ink-60 rounded-pill border-2 cursor-pointer active:ring-blush active:bg-blush active:scale-95 hover:bg-blush/50  disabled:bg-mauve disabled:text-mauve">Изменить</button>
                <button type="button" name="deleteService" onClick={() => setSelected("delete")} className="font-body font-bold text-base tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush text-ink-60 rounded-pill border-2 cursor-pointer active:ring-blush active:bg-blush active:scale-95 hover:bg-blush/50  disabled:bg-mauve disabled:text-mauve">Удалить</button>
            </div>
            <div className="flex min-w-full lg:w-[60%] py-6 lg:pb-12 lg:pt-0">
                {selected === "add" && 
                <form action="" className="flex flex-col gap-4 ">
                    <h2 className="text-balance font-handwriting text-[clamp(0.9rem,2vw,1.7rem)] font-semibold tracking-wider text-magenta/70 pb-5">Добавьте новую услугу в каталог, обязательно введите тексты на русском, английском и испанском</h2>
                    <fieldset className="flex min-w-0 flex-col gap-2">
                        <legend className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80">Название услуги от 2 до 150 символов</legend>
                        {LANGUAGES.map(({ code, label }) => (
                            <TextArea
                                key={code}
                                label={label}
                                name={`title_${code}`}
                                testId={`service-title-${code}`}
                                rows={2}
                                minLength={2}
                                maxLength={150}
                                required
                                
                            />
                        ))}
                    </fieldset>
                    <fieldset className="flex min-w-0 flex-col gap-4">
                        <legend className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80">Описание услуги от 10 до 500 символов</legend>
                        {LANGUAGES.map(({ code, label }) => (
                            <TextArea
                                key={code}
                                label={label}
                                name={`description_${code}`}
                                testId={`service-description-${code}`}
                                rows={5}
                                minLength={10}
                                maxLength={500}
                                required
                            />
                        ))}
                    </fieldset>
                    <NumberInput
                        label="Продолжительность услуги в минутах"
                        unit="мин"
                        name="duration"
                        testId="service-duration"
                        min={5}
                        max={480}
                        required
                    />
                    <NumberInput
                        label="Стоимость услуги в евро"
                        unit="€"
                        name="price"
                        testId="service-price"
                        step="0.01"
                        min={1}
                        max={1000}
                        required
                    />
                    <button className="mt-4 mb-4 font-body font-bold text-[1.2em] tracking-wider px-6 py-3 min-h-11 min-w-9 border-mint  bg-mint transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint text-ink-60 rounded-pill border-2 cursor-pointer active:ring-magenta active:bg-magenta active:scale-95 hover:brightness-105  disabled:bg-mauve disabled:text-mauve lg:max-w-[300px]">Добавить</button>
                </form>
                }

            </div>
            
        </div>
            );
}