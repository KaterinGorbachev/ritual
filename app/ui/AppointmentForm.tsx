"use client";

import { useId, useRef, useState } from "react";
import { isValidName, isValidPhone } from "../lib/bookingValidation";
import type { Slot } from "./SlotCard";

export type LanguageOption = {
  /** Stored value, e.g. "es". */
  value: string;
  /** Visible label in that language, e.g. "Español". */
  label: string;
};

export type AppointmentFormLabels = {
  /** Heading above the slot summary, e.g. "Your appointment". */
  heading: string;
  duration: string;
  date: string;
  price: string;
  name: string;
  phone: string;
  /** Hint under the phone field, e.g. "Include your country code…". */
  phoneHint: string;
  language: string;
  languageOptions: LanguageOption[];
  /** Required consent checkbox copy (18+ and privacy policy). */
  consent: string;
  /** Link text under the consent box, pointing at the privacy policy. */
  privacyLink: string;
  /** Optional marketing checkbox copy. */
  marketing: string;
  confirm: string;
  /** Replaces the confirm label while the reservation is being sent. */
  sending: string;
  later: string;
  errors: {
    name: string;
    phone: string;
    consent: string;
    /** Human fallback when the reservation could not be sent at all. */
    submit: string;
  };
};

/**
 * Evidence that the client accepted the privacy policy.
 *
 * Art. 7.1 of the GDPR puts the burden of proof on the salon, and proving
 * consent means proving *which text* was accepted, in *which language*, and
 * *when*. A bare `true` proves none of that, which is why this is an object
 * rather than a boolean.
 */
export type ConsentRecord = {
  policyAccepted: true;
  /** `privacy.meta.dateLastModification` of the policy that was on screen. */
  policyVersion: string;
  /** The language the client actually read the policy in. */
  locale: string;
  /** Where the tick happened, so a WhatsApp opt-in is distinguishable. */
  source: "booking-form";
};

/** What a completed form hands back to the parent. */
export type AppointmentDetails = {
  slotId: string;
  name: string;
  phone: string;
  language: string;
  marketingOptIn: boolean;
  consent: ConsentRecord;
};

type AppointmentFormProps = {
  slot: Slot;
  labels: AppointmentFormLabels;
  /** Version of the privacy policy this form is showing a link to. */
  policyVersion: string;
  /** Locale of the policy text the client was shown. */
  locale: string;
  /**
   * Receives the validated details. May be async — the form shows a pending
   * state until it settles, and surfaces a human message if it rejects. A
   * rejection with a `message` is shown as-is (so the caller can pass a
   * translated Firestore/API error); anything else falls back to
   * `labels.errors.submit`.
   */
  onConfirm: (details: AppointmentDetails) => void | Promise<void>;
  onCancel: () => void;
};

type FieldErrors = {
  name?: string;
  phone?: string;
  consent?: string;
};

const inputClass =
  "min-h-11 w-full rounded-pill border-2 border-mauve/30 bg-cream px-4 py-2 font-body text-ink transition duration-500 ease-in-out hover:border-magenta focus:border-mint focus:outline-none aria-[invalid=true]:border-magenta";

const checkboxClass =
  "mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-mint focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream";

/**
 * The booking form shown inside the appointment dialog: a summary of the slot
 * being booked, then name, phone and preferred language, a required 18+/privacy
 * consent, and an optional marketing opt-in.
 *
 * ## React practice
 *
 * All five fields are **controlled inputs** — React state is the single source
 * of truth, so validation, the button state and the submitted payload can never
 * disagree with what the client sees. Validation runs on submit rather than on
 * every keystroke (nobody should be told their phone number is wrong while
 * typing the third digit), and each field's error clears as soon as that field
 * becomes valid, so corrections feel immediate.
 *
 * Submission goes through the form's own `onSubmit`, not a button click
 * handler, so `Enter` in any field submits exactly like pressing Confirm.
 * `noValidate` hands validation to us: the browser's native bubbles cannot be
 * translated into ru/es/en, and these messages must be.
 *
 * ## Sending
 *
 * `onConfirm` may be async. While it is in flight the form is `pending`: the
 * confirm button is disabled and relabelled, which is what stops a double tap
 * from reserving the same slot twice. A rejection leaves the form filled in and
 * the button live again so the client can retry — the details are never thrown
 * away on a failed send.
 *
 * ## Accessibility
 *
 * Every field has a visible `<label>` (never a placeholder standing in for
 * one). Invalid fields get `aria-invalid` plus an `aria-describedby` pointing
 * at their message, so a screen reader reads the problem with the field rather
 * than as loose text. All problems are reported at once, and focus jumps to the
 * first invalid field so a keyboard user lands where the work is. A failed send
 * is announced through `role="alert"`.
 */
export function AppointmentForm({
  slot,
  labels,
  policyVersion,
  locale,
  onConfirm,
  onCancel,
}: AppointmentFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState(
    labels.languageOptions[0]?.value ?? "",
  );
  const [consent, setConsent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const nameId = useId();
  const phoneId = useId();
  const phoneHintId = useId();
  const languageId = useId();
  const consentId = useId();
  const marketingId = useId();
  const nameErrorId = useId();
  const phoneErrorId = useId();
  const consentErrorId = useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A disabled button already blocks the common case; this also covers a
    // programmatic submit or an Enter key landing mid-flight.
    if (pending) return;

    // Collect every problem in one pass so the client fixes them together.
    const next: FieldErrors = {};
    if (!isValidName(name)) next.name = labels.errors.name;
    if (!isValidPhone(phone)) next.phone = labels.errors.phone;
    if (!consent) next.consent = labels.errors.consent;

    setErrors(next);
    setSubmitError(null);

    if (next.name || next.phone || next.consent) {
      // Land the keyboard on the first thing that needs attention.
      if (next.name) nameRef.current?.focus();
      else if (next.phone) phoneRef.current?.focus();
      else consentRef.current?.focus();
      return;
    }

    setPending(true);
    try {
      await onConfirm({
        slotId: slot.id,
        name: name.trim(),
        phone: phone.trim(),
        language,
        marketingOptIn,
        // Only reachable once `consent` is true — the guard above returns
        // early otherwise — so this can never claim an acceptance that did
        // not happen. The timestamp is added server-side, where the clock is
        // not the client's to set.
        consent: {
          policyAccepted: true,
          policyVersion,
          locale,
          source: "booking-form",
        },
      });
    } catch (error) {
      // Prefer a message the caller already translated; never show a raw
      // error code to a client.
      const message = error instanceof Error ? error.message : "";
      setSubmitError(
        message && message !== "network" ? message : labels.errors.submit,
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="appointment-form"
      className="flex flex-col gap-5"
    >
      {/* What is being booked. */}
      <section className="flex flex-col gap-2 rounded-card border border-blush/10 bg-blush/15 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-handwriting text-lg text-magenta">
            {labels.heading}
          </h3>
          <p className="font-body text-lg font-bold text-ink">
            {slot.service}
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 font-body text-sm text-ink/75 text-base">
          <div className="flex gap-1.5">
            <dt >{labels.date}:</dt>
            <dd className="font-semibold text-ink">{slot.date}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{labels.duration}:</dt>
            <dd className="font-semibold text-ink">{slot.duration}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{labels.price}:</dt>
            <dd className="font-bold text-ink ">{slot.price}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={nameId}
          className="font-body text-sm font-semibold text-ink"
        >
          {labels.name}*
        </label>
        <input
          id={nameId}
          ref={nameRef}
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            // Clear this field's error the moment it becomes valid.
            if (errors.name && isValidName(event.target.value)) {
              setErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          className={inputClass}
        />
        {errors.name ? (
          <p id={nameErrorId} className="font-body text-sm text-magenta">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={phoneId}
          className="font-body text-sm font-semibold text-ink"
        >
          {labels.phone}*
        </label>
        <input
          id={phoneId}
          ref={phoneRef}
          // `type="tel"` brings up the digit keypad on mobile; it does
          // no validation of its own, which is why we do ours.
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            if (errors.phone && isValidPhone(event.target.value)) {
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }
          }}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={`${phoneHintId}${errors.phone ? ` ${phoneErrorId}` : ""}`}
          className={inputClass}
        />
        <p id={phoneHintId} className="font-body text-sm text-ink/70">
          {labels.phoneHint}
        </p>
        {errors.phone ? (
          <p id={phoneErrorId} className="font-body text-sm text-magenta">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={languageId}
          className="font-body text-sm font-semibold text-ink"
        >
          {labels.language}
        </label>
        <select
          id={languageId}
          name="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          {labels.languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <input
            id={consentId}
            ref={consentRef}
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              if (errors.consent && event.target.checked) {
                setErrors((prev) => ({ ...prev, consent: undefined }));
              }
            }}
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? consentErrorId : undefined}
            className={checkboxClass}
          />
          <label
            htmlFor={consentId}
            className="cursor-pointer font-body text-sm leading-relaxed text-ink/80 font-bold"
          >
            {labels.consent}*
          </label>
        </div>
        {/* Consent is only valid if it is informed (art. 4.11), so the policy
            has to be one click away from the box that accepts it. Outside the
            <label> on purpose: a link nested in a label swallows the click
            that should toggle the checkbox. */}
        <a
          href={`/${locale}/privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-fit items-center rounded-pill font-body text-sm text-iris underline transition duration-500 ease-in-out hover:text-magenta focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream"
        >
          {labels.privacyLink}
        </a>
        {errors.consent ? (
          <p id={consentErrorId} className="font-body text-sm text-magenta">
            {errors.consent}
          </p>
        ) : null}

        <div className="flex items-start gap-3">
          <input
            id={marketingId}
            type="checkbox"
            name="marketing"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            className={checkboxClass}
          />
          <label
            htmlFor={marketingId}
            className="cursor-pointer font-body text-sm leading-relaxed text-ink/80"
          >
            {labels.marketing}
          </label>
        </div>
      </div>

      {/* A failed send. `role="alert"` announces it immediately — the
                client is waiting on this outcome. */}
      {submitError ? (
        <p
          role="alert"
          data-testid="appointment-form-error"
          className="rounded-card border border-magenta/20 bg-blush/15 p-3 font-body text-sm text-ink/80"
        >
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between w-full gap-3 mt-6">
        {/* "Maybe later" is a real escape hatch, so it is a peer of
                    Confirm rather than a buried link — but styled as the ghost
                    secondary so the primary action stays obvious. */}
        <button
          type="button"
          onClick={onCancel}
          data-testid="appointment-form-later"
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill border border-iris/40 bg-cream/50 px-6 py-3 font-body text-iris transition duration-500 ease-in-out hover:border-magenta hover:text-magenta focus:border-mint focus:outline-none active:scale-95"
        >
          {labels.later}
        </button>

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          data-testid="appointment-form-confirm"
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill bg-mint px-6 py-3 font-body font-bold tracking-wider text-ink shadow-sm transition duration-500 ease-in-out hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95 active:bg-magenta disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
        >
          {pending ? labels.sending : labels.confirm}
        </button>
      </div>
    </form>
  );
}
