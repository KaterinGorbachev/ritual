"use client";

import { useId } from "react";
import { FormField, describedBy } from "./FormField";

export type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  "className" | "type" | "inputMode"
> & {
  /** Visible label, e.g. "Duration of the service". */
  label: string;
  /** What the number is measured in, shown beside it: "min", "€". */
  unit: string;
  /** `end` reads "60 min" / "65 €" (ru, es); `start` reads "€65" (en). */
  unitPosition?: "start" | "end";
  /** Helper copy under the field, e.g. "From 5 to 480 minutes". */
  hint?: string;
  /** Human, translated problem with the current value. Setting it marks the field invalid. */
  error?: string;
  /**
   * Base for the `data-testid`s: the input gets it as-is, and its parts get
   * `-field`, `-control`, `-unit`, `-hint` and `-error`.
   */
  testId?: string;
};

// The border, radius and focus ring live on the box around the input, not on
// the input itself, so the unit sits *inside* the outline and the whole thing
// lights up as one control. Hover is switched off while focused (`not-…`):
// `hover:` outranks `focus-within:` in Tailwind's variant order, and a magenta
// hover border would otherwise repaint over the mint focus border.
const controlBase =
  "flex min-h-11 w-full items-center gap-2 rounded-pill border-2 bg-cream px-4 font-body text-base text-ink transition duration-500 ease-in-out focus-within:border-mint focus-within:ring-2 focus-within:ring-mint focus-within:ring-offset-2 focus-within:ring-offset-cream";

// Native spinner arrows are tiny (well under 44px) and let a stray scroll or
// click change a price. Typing is the interface here, so they go.
const inputClass =
  "min-w-0 flex-1 self-stretch bg-transparent py-2 font-body text-base tabular-nums text-ink outline-hidden placeholder:text-ink/60 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const unitClass = "shrink-0 select-none font-body text-base text-ink/75";

/**
 * A labelled number field with its unit built in — one component for both
 * "duration in minutes" and "price in euro" (and anything else measured).
 *
 * ## Limits
 *
 * `min`, `max`, `step` and `required` are the native attributes, passed
 * straight through, so the browser's constraint validation (`validity`,
 * `checkValidity()`, the `:invalid` state) works with no extra code. `step`
 * defaults to whole numbers — right for minutes; pass `step="0.01"` for cents.
 * The browser's own bubble text cannot be translated, so a form that wants
 * ru/es/en messages should use `noValidate` and feed its own `error` string in.
 *
 * ## Keypad
 *
 * `inputMode` follows `step`: a whole-number step asks a phone for the digit
 * pad, a fractional one (or `"any"`) for the pad with a decimal separator.
 *
 * ## The unit is a label
 *
 * The unit is a second `<label>` for the same input, not loose text. A screen
 * reader therefore announces it as part of the field's name ("Price €"), and a
 * click or tap on the unit focuses the input, with no ARIA and no handler.
 *
 * ## Accessibility
 *
 * The visible label, the `*` on required fields, and the hint and error
 * wiring come from `FormField`. Error is text plus a magenta outline — never
 * colour alone. Scrolling the wheel over a focused number field would silently
 * change its value, so the input lets go of focus on wheel and the page scrolls.
 *
 * Strings all arrive as props — the component never imports a dictionary.
 */
export function NumberInput({
  label,
  unit,
  unitPosition = "end",
  hint,
  error,
  testId = "number-input",
  id,
  step,
  required,
  disabled,
  onWheel,
  "aria-describedby": describedByProp,
  ...rest
}: NumberInputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  // Number("any") is NaN, which is not an integer, so "any" gets the decimal pad.
  const inputMode = Number.isInteger(Number(step ?? 1)) ? "numeric" : "decimal";

  const unitLabel = (
    <label htmlFor={fieldId} data-testid={`${testId}-unit`} className={unitClass}>
      {unit}
    </label>
  );

  return (
    <FormField
      id={fieldId}
      label={label}
      required={required}
      hint={hint}
      error={error}
      testId={testId}
    >
      <div
        data-testid={`${testId}-control`}
        className={`${controlBase} ${
          error ? "border-magenta" : "border-mauve/30 not-focus-within:hover:border-magenta"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {unitPosition === "start" ? unitLabel : null}
        <input
          {...rest}
          id={fieldId}
          type="number"
          inputMode={inputMode}
          step={step}
          required={required}
          disabled={disabled}
          onWheel={(event) => {
            event.currentTarget.blur();
            onWheel?.(event);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, { hint, error }, describedByProp)}
          data-testid={testId}
          className={inputClass}
        />
        {unitPosition === "end" ? unitLabel : null}
      </div>
    </FormField>
  );
}
