import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { SuccessDialog } from "../../ui/SuccessDialog";

const labels = {
    title: "Thank you!",
    message:
        "We will connect with you by WhatsApp for service confirmation. Before that the reservation is not completed.",
    done: "Done",
    close: "Close dialog",
};

/** The <dialog> element under test. */
const dialogEl = () => document.querySelector("dialog") as HTMLDialogElement;

describe("SuccessDialog", () => {
    it("stays closed until asked to open", async () => {
        await render(<SuccessDialog open={false} onClose={() => { }} labels={labels} />);
        // A native <dialog> keeps its content in the DOM when shut, so the
        // closed state is `open`, not absence from the tree.
        expect(dialogEl().open).toBe(false);
    });

    it("shows the thank-you heading and the full confirmation message", async () => {
        const screen = await render(<SuccessDialog open onClose={() => { }} labels={labels} />);
        await expect
            .element(screen.getByRole("heading", { name: labels.title }))
            .toBeInTheDocument();
        await expect.element(screen.getByText(labels.message)).toBeInTheDocument();
    });

    it("is a modal dialog named by its title", async () => {
        const screen = await render(<SuccessDialog open onClose={() => { }} labels={labels} />);
        await expect
            .element(screen.getByRole("dialog", { name: labels.title }))
            .toBeInTheDocument();
        // showModal() confers modal semantics natively — there is no literal
        // aria-modal attribute to assert on.
        expect(dialogEl().matches(":modal")).toBe(true);
    });

    it("announces itself politely to assistive tech as a status", async () => {
        await render(<SuccessDialog open onClose={() => { }} labels={labels} />);
        const status = document.querySelector('[data-testid="success-dialog-status"]');
        expect(status?.getAttribute("role")).toBe("status");
    });

    it("closes from the done button", async () => {
        const onClose = vi.fn();
        const screen = await render(<SuccessDialog open onClose={onClose} labels={labels} />);
        await userEvent.click(screen.getByRole("button", { name: labels.done }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape", async () => {
        const onClose = vi.fn();
        await render(<SuccessDialog open onClose={onClose} labels={labels} />);
        await userEvent.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
