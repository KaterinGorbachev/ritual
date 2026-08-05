"use client";

import { Modal } from "./Modal";

export type SuccessDialogLabels = {
    /** Heading, e.g. "Thank you!". */
    title: string;
    /** The full confirmation sentence, already localised. */
    message: string;
    /** Dismiss button, e.g. "Done". */
    done: string;
    /** aria-label for the icon-only close control. */
    close: string;
};

type SuccessDialogProps = {
    open: boolean;
    onClose: () => void;
    labels: SuccessDialogLabels;
};

/**
 * A reusable confirmation dialog for the end of a flow. Built on `Modal`, so it
 * inherits the native `<dialog>` behaviour — top layer, focus trap, `Esc`, and
 * a backdrop that leaves the sticky header visible.
 *
 * The message is wrapped in a `role="status"` region, which is a polite live
 * region: assistive tech announces the outcome without interrupting whatever it
 * is currently reading. The copy is deliberately plain about the booking not
 * being final yet — this is the moment to be clear, not playful.
 */
export function SuccessDialog({ open, onClose, labels }: SuccessDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={labels.title}
            labels={{ close: labels.close }}
            className="max-w-md"
        >
            <div data-testid="success-dialog" className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                    {/* Sketched check in a circle — decorative; the text carries
                        the meaning, so success never rests on the glyph alone. */}
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint/30 text-iris">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M8 12.5l2.5 2.5L16 9.5" />
                        </svg>
                    </span>

                    <p
                        data-testid="success-dialog-status"
                        role="status"
                        className="font-body text-base leading-relaxed text-ink/80"
                    >
                        {labels.message}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    data-testid="success-dialog-done"
                    className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center self-end rounded-pill bg-mint px-6 py-3 font-body font-bold tracking-wider text-ink shadow-sm transition duration-500 ease-in-out hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95 active:bg-magenta"
                >
                    {labels.done}
                </button>
            </div>
        </Modal>
    );
}
