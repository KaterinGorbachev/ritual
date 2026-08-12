"use client";

// Opens the browser's own print dialog for the current page.
//
// Deliberately the native dialog rather than a link to a pre-rendered PDF: the
// page already carries print styles (see the @media print block in
// globals.css), so the printed sheet is generated from the live text — it can
// never fall out of date with the policy the way a stored file does. The reader
// also gets "Save as PDF" for free in that same dialog.
//
// Hidden when printing: a Print button on a sheet of paper is noise.

export function PrintButton({ label }: { label: string }) {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            data-testid="print-button"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-pill border border-iris/40 bg-cream/50 px-6 py-3 font-body text-iris transition duration-500 ease-in-out hover:border-magenta hover:text-magenta focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95 print:hidden"
        >
            <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-iris/15"
            >
                {/* Printer, sketched — 1px stroke, currentColor. */}
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M7 9V3.5h10V9" />
                    <path d="M7 18H5.5A1.5 1.5 0 0 1 4 16.5v-5A1.5 1.5 0 0 1 5.5 10h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17" />
                    <path d="M7 14h10v6.5H7z" />
                </svg>
            </span>
            {label}
        </button>
    );
}
