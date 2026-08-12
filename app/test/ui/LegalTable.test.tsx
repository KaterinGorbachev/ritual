import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { LegalTable } from "../../ui/LegalTable";

const table = {
  columns: ["Purpose", "Legal basis", "Optional?"],
  rows: [
    ["Replying on WhatsApp", "Art. 6.1.b — your own request", "No tick needed"],
    ["Marketing messages", "Art. 6.1.a consent", "Yes — always optional"],
  ],
};

const caption = "Purposes and their legal basis";

const legalTable = (over: Partial<React.ComponentProps<typeof LegalTable>> = {}) => (
  <LegalTable table={table} caption={caption} {...over} />
);

describe("LegalTable", () => {
  it("renders a real table with an accessible name from its caption", async () => {
    const screen = await render(legalTable());
    await expect
      .element(screen.getByRole("table", { name: caption }))
      .toBeInTheDocument();
  });

  it("renders the caption as visible text", async () => {
    const screen = await render(legalTable());
    await expect.element(screen.getByText(caption)).toBeVisible();
  });

  it("marks every column header with scope=col", async () => {
    const screen = await render(legalTable());
    for (const column of table.columns) {
      const header = screen.getByRole("columnheader", { name: column });
      await expect.element(header).toBeInTheDocument();
      await expect.element(header).toHaveAttribute("scope", "col");
    }
  });

  it("renders one row per data row plus the header row", async () => {
    const screen = await render(legalTable());
    const rows = screen.getByRole("row").all();
    expect(rows.length).toBe(table.rows.length + 1);
  });

  it("renders every cell value", async () => {
    const screen = await render(legalTable());
    for (const row of table.rows) {
      for (const cell of row) {
        await expect.element(screen.getByText(cell)).toBeVisible();
      }
    }
  });

  it("wraps the table in a keyboard-reachable horizontal scroller", async () => {
    const screen = await render(legalTable());
    // On a narrow screen the table must scroll inside itself rather than
    // breaking the page — and a scrollable region needs keyboard access.
    const scroller = screen.getByTestId("legal-table-scroll");
    await expect.element(scroller).toHaveAttribute("tabindex", "0");
    await expect.element(scroller).toHaveAttribute("role", "region");
  });

  // --- Mobile card view -----------------------------------------------------
  //
  // Below the `md` breakpoint each row becomes a card and every cell is
  // prefixed with its column name, injected by CSS from `data-label`. That
  // attribute is what makes the card readable, so it is asserted here rather
  // than left to a visual check.

  it("labels every cell with its column name for the mobile card view", async () => {
    const screen = await render(legalTable());
    const cells = screen.getByRole("cell").all();
    expect(cells.length).toBe(table.rows.length * table.columns.length);

    for (const [i, cell] of cells.entries()) {
      // Cells are in row-major order, so the column repeats every `cols`.
      const expected = table.columns[i % table.columns.length];
      await expect.element(cell).toHaveAttribute("data-label", expected);
    }
  });

  it("marks the table so the stylesheet can switch it to cards", async () => {
    const screen = await render(legalTable());
    await expect
      .element(screen.getByRole("table", { name: caption }))
      .toHaveClass("legal-table");
  });
});
