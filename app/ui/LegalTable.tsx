// A legal-document table (legal basis, retention periods) rendered as a real
// <table> rather than a grid of divs, so screen readers announce each cell with
// its column, and so the whole thing survives being printed or copied.
//
// ## Two layouts, one markup
//
// A three-column legal table is unreadable on a phone: 320px cannot hold three
// columns of prose, and a horizontal scroller makes the reader pan back and
// forth to pair a value with its heading.
//
// So below `md` the stylesheet (`.legal-table`, in globals.css) switches the
// table to **one card per row**: the `<thead>` is hidden and each cell prints
// its own column name from `data-label` via `::before`. That is why every `<td>`
// carries `data-label` — it is the mobile layout's only source for the heading,
// and a missing one produces a value with no label.
//
// The markup stays a real `<table>` throughout: `display: block` changes how it
// paints, and the semantics a screen reader uses come from the element and its
// `scope="col"` headers, which survive. From `md` up it is an ordinary table,
// scrolling inside a focusable `role="region"` container if it still overflows
// (WCAG 2.4.7 / 2.1.1).

export type LegalTableData = {
    columns: string[];
    rows: string[][];
};

export function LegalTable({
    table,
    caption,
}: {
    table: LegalTableData;
    /** Visible caption; also the table's accessible name. */
    caption: string;
}) {
    return (
        <div
            // `tabindex=0` + a role and a name make the scroller a landmark a
            // keyboard user can focus and scroll with the arrow keys.
            role="region"
            aria-label={caption}
            tabIndex={0}
            data-testid="legal-table-scroll"
            className="w-full overflow-x-auto rounded-card border border-blush/10 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream"
        >
            {/* `legal-table` is the hook the card-view media query keys off;
                `lg:min-w-xl` only applies once the real table layout is back at
                1024px, so it can never force a horizontal scroll on a phone or
                tablet. */}
            <table className="legal-table w-full border-collapse text-left font-body text-sm lg:min-w-xl">
                {/* Must be a real <caption>: it is the table's accessible name,
                    and it is the only element HTML allows here — a <p> inside
                    <table> is hoisted out by the parser, which silently strips
                    the heading off the table and leaves it unnamed. `caption-top`
                    keeps it rendered above the table as the design intends. */}
                <caption className="caption-top w-full px-4 pt-4 pb-3 text-left font-handwriting text-xl text-magenta">
                    {caption}
                </caption>
                <thead>
                    <tr className="border-b border-mauve/30">
                        {table.columns.map((column) => (
                            <th
                                key={column}
                                scope="col"
                                className="px-4 py-3 align-top font-body font-bold tracking-wider text-ink"
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className="border-b border-blush/10 last:border-b-0"
                        >
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    // Read by the card view's ::before to print
                                    // the column name beside the value.
                                    data-label={table.columns[cellIndex]}
                                    className="px-4 py-3 align-top leading-relaxed text-ink/80"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
