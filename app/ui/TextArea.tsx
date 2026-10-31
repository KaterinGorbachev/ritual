"use client";

import { useId, useState } from "react";
import { FormField, describedBy } from "./FormField";

export type TextAreaProps = Omit<React.ComponentProps<"textarea">, "className"> & {
  /** Visible label. Always rendered — a placeholder is never the label. */
  label: string;
  /** Helper copy under the field, e.g. "From 2 to 150 characters". */
  hint?: string;
  /** Human, translated problem with the current value. Setting it marks the field invalid. */
  error?: string;
  /**
   * Base for the `data-testid`s: the textarea gets it as-is, and its parts get
   * `-field`, `-hint`, `-error` and `-counter`, so E2E tests can address each.
   */
  testId?: string;
};

const areaClass =
  "min-h-11 w-full rounded-card border-2 border-mauve/30 bg-cream px-4 py-3 font-body text-base text-ink transition duration-500 ease-in-out placeholder:text-ink/60 hover:border-magenta focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream aria-[invalid=true]:border-magenta disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-mauve/30 resize-none";

/**
 * A labelled multi-line field in the Ritual look: cream surface, 20px card
 * radius (a 40px pill would swallow the corners of a multi-line box), mauve
 * hairline at rest, magenta on hover and when invalid, mint on focus.
 *
 * ## Controlled or not
 *
 * Works either way, like a native `<textarea>`: pass `value` + `onChange` to
 * own the state, or `defaultValue` (or nothing) to let the DOM own it. The
 * character counter follows whichever is in charge — the `value` prop when
 * controlled, so it can never disagree with what the box shows.
 *
 * ## Counter
 *
 * Shown only when `maxLength` is set. The browser enforces the limit itself and
 * drops extra keystrokes silently, so the counter goes bold at the limit to say
 * why nothing more is appearing. It is described-by the field but deliberately
 * not a live region: announcing "37 of 150" on every keystroke is noise.
 *
 * ## Accessibility
 *
 * The `<label>` is tied by `htmlFor`; a required field gets a visible `*` that
 * is `aria-hidden`, because the native `required` attribute is what a screen
 * reader announces. Hint, error and counter are all wired through
 * `aria-describedby`, so they are read with the field rather than as loose
 * text. The error is text, never just a colour change.
 *
 * Group related fields (e.g. RU / EN / ES titles) in a `<fieldset>` with a
 * `<legend>` so the shared question is read once with each of them.
 *
 * Strings all arrive as props — the component never imports a dictionary.
 */
export function TextArea({
  label,
  hint,
  error,
  testId = "textarea",
  id,
  rows = 3,
  required,
  maxLength,
  value,
  defaultValue,
  onChange,
  "aria-describedby": describedByProp,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const counterId = `${fieldId}-counter`;

  // Only used while uncontrolled; when `value` is given it wins.
  const [typedLength, setTypedLength] = useState(String(defaultValue ?? "").length);
  const isControlled = value !== undefined;
  const length = isControlled ? String(value).length : typedLength;

  const hasCounter = maxLength !== undefined;
  const atLimit = hasCounter && length >= maxLength;

  const counter = hasCounter ? (
    <span
      id={counterId}
      data-testid={`${testId}-counter`}
      className={`shrink-0 font-body text-sm tabular-nums ${
        atLimit ? "font-bold text-ink" : "text-ink/70"
      }`}
    >
      {`${length} / ${maxLength}`}
    </span>
  ) : null;

  return (
    <FormField
      id={fieldId}
      label={label}
      required={required}
      hint={hint}
      error={error}
      testId={testId}
      aside={counter}
    >
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (!isControlled) setTypedLength(event.target.value.length);
          onChange?.(event);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(
          fieldId,
          { hint, error },
          hasCounter ? counterId : undefined,
          describedByProp,
        )}
        data-testid={testId}
        className={areaClass}
      />
    </FormField>
  );
}
