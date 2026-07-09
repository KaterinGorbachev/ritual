"use client";

import { useRouter, usePathname } from "next/navigation";
import { Dropdown } from "./Dropdown";

const languages = [
  { locale: "en", label: "English", code: "EN" },
  { locale: "ru", label: "Русский", code: "RU" },
  { locale: "es", label: "Español", code: "ES" },
] as const;

export function LangButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Current locale is the first path segment, e.g. "/es/about" -> "es"
  const current = pathname.split("/")[1] ?? "";
  const active =
    languages.find((l) => l.locale === current) ?? languages[0];

  function switchTo(locale: string) {
    // Replace the first segment with the chosen locale, keep the rest.
    // "/en/about" -> ["", "en", "about"] -> "/es/about"
    const segments = pathname.split("/");
    segments[1] = locale;
    // replace (not push): switching language isn't a new history entry, so Back
    // won't cycle through locales. scroll:false keeps the reader's position
    // instead of jumping to the top on the route change.
    router.replace(segments.join("/"), { scroll: false });
  }

  return (
    <Dropdown className="relative group" data-testid="language-selector">
      <summary
        aria-label="Language selector"
        data-testid="language-selector-button"
        className="cursor-pointer group items-center justify-center gap-1.5 rounded-full w-11 h-11 px-4 py-3 border-2 border-transparent shadow-sm bg-cream backdrop-blur  transition duration-500 ease-in-out focus:outline-none focus:border-mint fous:ring-2 focus:ring-mint  hover:brightness-95 hover:border-magenta active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-ink font-body text-base font-light flex list-none select-none [&::-webkit-details-marker]:hidden"
      >
        <span className="font-display text-base font-semibold tracking-normal">
          {active.code}
        </span>
      </summary>
      <div
        className="absolute right-0 mt-2 min-w-40 flex flex-col gap-4 p-2 rounded-2xl border-2 border-mauve/30 bg-cream backdrop-blur-md shadow-lg z-50"
        data-testid="language-selector-panel"
      >
        {languages.map(({ locale, label, code }) => (
          <button
            key={locale}
            type="button"
            onClick={() => switchTo(locale)}
            aria-current={locale === active.locale ? "true" : undefined}
            data-testid={`language-option-${code}`}
            className="flex justify-between px-2 py-1 rounded-pill border-2 border-transparent text-base font-normal tracking-wider leading-5 text-ink font-body cursor-pointer hover:font-bold focus:underline active:text-magenta aria-current:font-bold "
          >
            <span>{label}</span>
            <span className="font-display italic text-magenta">{code}</span>
          </button>
        ))}
      </div>
    </Dropdown>
  );
}
