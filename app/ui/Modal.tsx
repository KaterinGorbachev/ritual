"use client";

import { useEffect, useId, useRef } from "react";

export type ModalLabels = {
    /** aria-label for the icon-only close control, e.g. "Close dialog". */
    close: string;
};

type ModalProps = {
    open: boolean;
    onClose: () => void;
    /** Visible dialog title — also the dialog's accessible name. */
    title: string;
    /** Optional line under the title (e.g. the service being booked). */
    subtitle?: string;
    labels: ModalLabels;
    children: React.ReactNode;
    /** Extra classes for the panel, e.g. a wider `max-w-*` for a form. */
    className?: string;
};

/**
 * A reusable modal dialog built on the **native `<dialog>` element**.
 *
 * ## Teleporting, without a portal
 *
 * React's counterpart to Vue's `<Teleport>` is `createPortal(node, container)`,
 * which renders a node into another DOM container while keeping it in place in
 * the React tree. Its usual job is to escape ancestor CSS: an ancestor with
 * `overflow-hidden` clips a dialog, an ancestor `transform` makes
 * `position: fixed` resolve against that ancestor instead of the viewport, and
 * an ancestor `z-index` caps how high it can stack.
 *
 * `<dialog>` opened with `showModal()` solves that at the platform level
 * instead. The browser promotes it to the **top layer** — a separate painting
 * surface outside the normal stacking context — so it escapes ancestor
 * clipping, transforms and `z-index` *no matter where it sits in the DOM*. It
 * needs no portal, and it brings what a portal can't: a focus trap, `Esc` to
 * close, background inertness and a `::backdrop` pseudo-element, all from the
 * browser rather than hand-written effects.
 *
 * Because the top layer sits above the whole page, DOM placement is irrelevant
 * here: nesting this inside `<main>` would not lower it beneath the `z-40`
 * sticky header, and no `z-index` can lift the header above it.
 *
 * ## Keeping the header visible
 *
 * The lever is the backdrop, not the tree position. `::backdrop` is an ordinary
 * styleable box and need not cover the viewport, so it starts *below* the
 * header (`--modal-backdrop-top`) and the header is never dimmed or blurred.
 * The panel is pushed down by the same offset, so it never covers the header
 * either. Note that `showModal()` makes everything outside the dialog inert:
 * the header stays fully visible for orientation, but is not clickable until
 * the dialog closes — the standard modal contract, and what keeps screen-reader
 * users from wandering out of the dialog.
 *
 * ## Accessibility
 *
 * `<dialog>` carries `role="dialog"` and, under `showModal()`, `aria-modal`
 * semantics natively; `aria-labelledby` (plus `aria-describedby` when a
 * subtitle is given) names it. Focus moves into the panel on open and is
 * restored to the opener on close, `Tab` wraps inside, and `Esc` closes — all
 * browser behaviour. The element's own `cancel`/`close` events are forwarded to
 * `onClose` so React state stays in step however the dialog was dismissed.
 */
export function Modal({
    open,
    onClose,
    title,
    subtitle,
    labels,
    children,
    className = "",
}: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const subtitleId = useId();

    // `onClose` is usually an inline arrow, so it changes identity on every
    // parent render. A ref keeps the listener effect from re-binding each time.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    // Drive the element's imperative API from the `open` prop. `showModal()` is
    // what promotes the dialog to the top layer and turns on the focus trap,
    // Esc handling and background inertness — `open={true}` as an attribute
    // would render it inline with none of that.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    // The browser can close the dialog on its own (Esc fires `cancel`, then
    // `close`). Forward that to the parent so its state matches reality.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => onCloseRef.current();
        dialog.addEventListener("close", handleClose);
        return () => dialog.removeEventListener("close", handleClose);
    }, []);

    // A click on the backdrop lands on the <dialog> itself (the panel inside
    // stops it), so comparing the target to the element distinguishes the two.
    const handleClick = (event: React.MouseEvent<HTMLDialogElement>) => {
        if (event.target === dialogRef.current) onCloseRef.current();
    };

    return (
        <dialog
            ref={dialogRef}
            data-testid="modal"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? subtitleId : undefined}
            onClick={handleClick}
            className="modal-dialog w-full max-w-lg bg-transparent p-0 text-ink backdrop:bg-blush/50 backdrop:backdrop-blur-sm focus:outline-none"
        >
            {/* The visible panel. Clicks inside must not reach the <dialog>, or
                the backdrop check above would treat them as a dismissal. */}
            <div
                data-testid="modal-panel"
                onClick={(event) => event.stopPropagation()}
                className={`relative flex w-full flex-col gap-5 rounded-card border border-blush/10 bg-cream p-6 text-start shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] ${className}`}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2
                            id={titleId}
                            className="font-display text-2xl font-semibold leading-snug text-ink"
                        >
                            {title}
                        </h2>
                        {subtitle ? (
                            <p id={subtitleId} className="font-body text-sm text-ink/70">
                            </p>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={() => onCloseRef.current()}
                        aria-label={labels.close}
                        data-testid="modal-close"
                        className="inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-cream/80 text-iris shadow-sm transition duration-500 ease-in-out hover:border-magenta hover:text-magenta focus:border-mint focus:outline-none active:scale-95"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.6}
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>

                {children}
            </div>
        </dialog>
    );
}
