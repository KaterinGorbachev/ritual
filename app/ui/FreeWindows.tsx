<div className="py-10 lg:py-18 flex flex-col items-center justify-center gap-6 lg:gap-12 w-full scroll-mt-24 " id="booking">
        <div className="flex flex-col gap-2 items-center justify-center px-4 text-center">
          <p className="font-handwriting text-magenta text-2xl leading-normal text-center">{dict.booking.eyebrow}</p>
          <h2 className="traking normal text-[clamp(1.75rem,5vw,2.25rem)] font-display font-semibold text-center">{dict.booking.title}</h2>
          <p className="font-body text-base tracking-normal text-ink/75 max-w-2xl">
            {dict.booking.description}
          </p>
        </div>
        <div className="w-full max-w-400 px-4 md:px-8 lg:px-24 py-10">
          <BookingSlots
            items={dict.booking.slots}
            policyVersion={dict.privacy.meta.dateLastModification}
            locale={locale}
            labels={{
              card: {
                duration: dict.booking.durationLabel,
                date: dict.booking.dateLabel,
                price: dict.booking.priceLabel,
                book: dict.booking.book,
              },
              nav: {
                previous: dict.booking.prev,
                next: dict.booking.next,
                track: dict.booking.trackLabel,
              },
              formTitle: dict.booking.formTitle,
              close: dict.booking.close,
              form: {
                heading: dict.booking.form.heading,
                duration: dict.booking.durationLabel,
                date: dict.booking.dateLabel,
                price: dict.booking.priceLabel,
                name: dict.booking.form.name,
                phone: dict.booking.form.phone,
                phoneHint: dict.booking.form.phoneHint,
                language: dict.booking.form.language,
                // Each language is named in its own tongue, so it stays
                // recognisable whichever locale the page is in.
                languageOptions: dict.booking.languages,
                consent: dict.booking.form.consent,
                privacyLink: dict.booking.form.privacyLink,
                marketing: dict.booking.form.marketing,
                confirm: dict.booking.form.confirm,
                sending: dict.booking.form.sending,
                later: dict.booking.form.later,
                errors: dict.booking.form.errors,
              },
              success: {
                title: dict.booking.success.title,
                message: dict.booking.success.message,
                done: dict.booking.success.done,
                close: dict.booking.close,
              },
            }}
          />
        </div>
      </div>