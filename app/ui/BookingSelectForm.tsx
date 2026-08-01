"use client";
import { useState } from "react";
import { SelectCategory, type SelectOption } from "./SelectCategory";
import { WhatsAppButton } from "./WhatsAppButton";

type Lang = "en" | "es" | "ru";

type Props = {
    defaultLang: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    languageLabel: string;
    bookLabel: string;
    formTitle: string;
};

const options = {
    en: [
        {
            label: "Face",
            value:
                "Hello! I would like to make an appointment for a facial procedure at Ritual.",
        },
        {
            label: "Body",
            value:
                "Hello! I am interested in a body procedure at Ritual and would like to make an appointment.",
        },
        {
            label: "Nails",
            value:
                "Hello! I would like to make an appointment for a nails procedure at Ritual.",
        },
        {
            label: "Other question",
            value:
                "Hello! I would like to make an appointment at Ritual ",
        },
    ],
    es: [
        {
            label: "Tratamiento facial",
            value:
                "¡Hola! Me gustaría pedir una cita para un tratamiento facial en Ritual.",
        },
        {
            label: "Tratamiento corporal",
            value:
                "¡Hola! Estoy interesada en un tratamiento corporal en Ritual y me gustaría pedir una cita.",
        },
        {
            label: "Tratamiento de uñas",
            value:
                "¡Hola! Me gustaría pedir una cita para un tratamiento de uñas en Ritual.",
        },
        {
            label: "Otra pregunta",
            value:
                "¡Hola! Me gustaría pedir una cita en Ritual",
        },
    ],
    ru: [
        {
            label: "Процедура для лица",
            value: "Здравствуйте! Хочу записаться на процедуру для лица в Ritual.",
        },
        {
            label: "Процедура для тела",
            value:
                "Здравствуйте! Меня интересуют процедуры для тела в Ritual, хочу записаться.",
        },
        {
            label: "Процедура для ногтей",
            value:
                "Здравствуйте! Хочу записаться на процедуру для ногтей в Ritual.",
        },
        {
            label: "Другой вопрос",
            value:
                "Здравствуйте! Хочу записаться в Ritual",
        },
    ],
};

const languageOptions: SelectOption[] = [
    { value: "en", label: "English" },
    { value: "ru", label: "Русский" },
    { value: "es", label: "Español" },
];

export function BookingSelectForm({
    defaultLang,
    categoryLabel,
    categoryPlaceholder,
    languageLabel,
    bookLabel,
    formTitle,
}: Props) {


    const [catIndex, setCatIndex] = useState<number | null>(null);
    const [language, setLanguage] = useState<SelectOption | null>(
    () => languageOptions.find((o) => o.value === defaultLang) ?? null
);

    // Message language: chosen one, or fall back to the page default.
    const langKey: Lang = (language?.value as Lang) ?? defaultLang;
    


    // Labels the user SEES stay in the page's default language.
    const uiOptions = options[defaultLang].map((o, i) => ({ value: String(i), label: o.label }));
    const uiValue = catIndex === null ? null : uiOptions[catIndex];


    // Message SENT = same index's `value` in the chosen (or default) language.
    const message = catIndex === null ? "" : options[langKey][catIndex].value;
    const ready = catIndex !== null;

    return (
        <div role="group" aria-label={categoryLabel} className="flex flex-col gap-4 md:gap-6 py-4 md:py-10 ...brand wrapper...">
            <p className="max-w-md font-display text-2xl text-ink/90 text-center md:text-start">{formTitle}</p>
            <div className="flex flex-col items-start justify-start gap-2 w-full">
                <label htmlFor="booking-category" className="text-base text-ink/70 font-body">{categoryLabel}</label>
                <SelectCategory inputId="booking-category" ariaLabel={categoryLabel}
                    placeholder={categoryPlaceholder} options={uiOptions}
                    value={uiValue} onChange={(o) => setCatIndex(o ? Number(o.value) : null)} />

            </div>
            <div className="flex flex-col items-start justify-start gap-2 w-full">
                <label htmlFor="booking-language" className="text-base text-ink/70 font-body">{languageLabel}</label>
                <SelectCategory inputId="booking-language" ariaLabel={languageLabel}
                    options={languageOptions}
                    value={language} onChange={setLanguage} />

            </div>




            <WhatsAppButton message={message} ariaLabel={bookLabel}
                className={ready ? "" : "opacity-60 pointer-events-none"}>
                <span>{bookLabel}</span>   {/* + WA glyph like ServiceItemCard */}
            </WhatsAppButton>
        </div>
    );
}
