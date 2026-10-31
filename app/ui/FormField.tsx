import type { ReactNode } from "react";

type FormFieldProps = {
  /** Id of the control. Also the base of the `-hint` and `-error` ids. */
  id: string;
  /** Visible label. Always rendered — a placeholder is never the label. */
  label: string;
  required?: boolean;
  /** Helper copy under the control, e.g. "From 5 to 480 minutes". */
  hint?: string;
  /** Human, translated problem with the current value. */
  error?: string;
  /** Base for the data-testids: `-field`, `-hint` and `-error`. */
  testId: string;
  /**
   * Sits at the end of the message row, e.g. a character counter. It must carry
   * its own id, and the control must list that id in `aria-describedby`.
   */
  aside?: ReactNode;
  /** The control itself — a `<textarea>`, an `<input>`, or a box around one. */
  children: ReactNode;
};

/**
 * The label above and the message row below every Ritual text-entry control:
 * a `<label htmlFor>`, a visible `*` for required fields, then hint and error.
 *
 * It only *renders* the wiring; the control must point back with
 * `aria-describedby={describedBy(id, { hint, error }, …)}` so the messages are
 * read with the field rather than as loose text. That is a function, not
 * something this component can do for you, because the control is a child.
 *
 * The `*` is `aria-hidden`: the native `required` attribute on the control is
 * what a screen reader announces, and a spoken "star" is just noise.
 */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  testId,
  aside,
  children,
}: FormFieldProps) {
  return (
    <div data-testid={`${testId}-field`} className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80"
      >
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>

      {children}

      {hint || error || aside ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {hint ? (
              <p
                id={`${id}-hint`}
                data-testid={`${testId}-hint`}
                className="font-body text-sm text-ink/70"
              >
                {hint}
              </p>
            ) : null}
            {error ? (
              // Text, not just a colour change — and never a raw error code.
              <p
                id={`${id}-error`}
                data-testid={`${testId}-error`}
                className="font-body text-sm font-semibold text-magenta"
              >
                {error}
              </p>
            ) : null}
          </div>
          {aside}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Value for a control's `aria-describedby`: its hint and error (when present),
 * then any extra ids — a counter, a caller's own reference. Undefined when
 * there is nothing to point at, so no empty attribute is rendered.
 */
export function describedBy(
  id: string,
  { hint, error }: { hint?: string; error?: string },
  ...extra: (string | undefined)[]
) {
  return (
    [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined, ...extra]
      .filter(Boolean)
      .join(" ") || undefined
  );
}
